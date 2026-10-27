package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/keren/pao-event-panel/config"
	"github.com/keren/pao-event-panel/internal/database"
	"github.com/keren/pao-event-panel/internal/model"
)

const (
	RoleAdmin      = "admin"
	RoleSuperAdmin = "super_admin"
)

var (
	ErrInvalidPasskey           = errors.New("invalid passkey")
	ErrPasskeyMatchesSuperAdmin = errors.New("admin passkey must differ from the super admin passkey")
)

type Session struct {
	Role string `json:"role"`
}

type LoginResult struct {
	Token string  `json:"token"`
	User  Session `json:"user"`
}

func Login(passkey string) (*LoginResult, error) {
	super := config.AppConfig.SuperAdminPasskey
	// Never let an unset env passkey match an empty input
	if super != "" && subtle.ConstantTimeCompare([]byte(passkey), []byte(super)) == 1 {
		return issue(RoleSuperAdmin, superAdminVersion())
	}

	var settings model.ActivitySettings
	if err := database.DB.First(&settings, 1).Error; err != nil {
		return nil, err
	}
	if settings.AdminPasskeyHash == "" ||
		bcrypt.CompareHashAndPassword([]byte(settings.AdminPasskeyHash), []byte(passkey)) != nil {
		return nil, ErrInvalidPasskey
	}
	return issue(RoleAdmin, strconv.Itoa(settings.AdminPasskeyVersion))
}

// SetAdminPasskey replaces the admin passkey and bumps its version, which ends every admin session
func SetAdminPasskey(passkey string) error {
	if passkey == config.AppConfig.SuperAdminPasskey {
		return ErrPasskeyMatchesSuperAdmin
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(passkey), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	result := database.DB.Model(&model.ActivitySettings{ID: 1}).Updates(map[string]interface{}{
		"admin_passkey_hash":    string(hash),
		"admin_passkey_version": gorm.Expr("admin_passkey_version + 1"),
	})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("activity settings not found")
	}
	return nil
}

// SessionValid reports whether a token's passkey version still matches the current passkey
func SessionValid(role, version string) bool {
	switch role {
	case RoleSuperAdmin:
		return version == superAdminVersion()
	case RoleAdmin:
		var settings model.ActivitySettings
		if err := database.DB.Select("admin_passkey_hash", "admin_passkey_version").First(&settings, 1).Error; err != nil {
			return false
		}
		return settings.AdminPasskeyHash != "" && version == strconv.Itoa(settings.AdminPasskeyVersion)
	}
	return false
}

// HMAC so the readable JWT payload doesn't leak a crackable hash of the env passkey
func superAdminVersion() string {
	mac := hmac.New(sha256.New, []byte(config.AppConfig.JWTSecret))
	mac.Write([]byte(config.AppConfig.SuperAdminPasskey))
	return hex.EncodeToString(mac.Sum(nil))[:16]
}

func issue(role, version string) (*LoginResult, error) {
	claims := jwt.MapClaims{
		"role": role,
		"ver":  version,
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(config.AppConfig.JWTSecret))
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, User: Session{Role: role}}, nil
}

func ParseJWT(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.AppConfig.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
