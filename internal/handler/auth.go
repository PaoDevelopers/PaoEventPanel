package handler

import (
	"errors"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/keren/pao-event-panel/internal/service"
)

type loginRequest struct {
	Passkey string `json:"passkey" binding:"required"`
}

type setPasskeyRequest struct {
	Passkey string `json:"passkey" binding:"required,min=6"`
}

const (
	maxLoginFailures = 5
	loginWindow      = time.Minute
)

type loginAttempts struct {
	count int
	start time.Time
}

// shortcut: in-memory limiter keyed on the socket IP (headers are spoofable), resets on restart;
// behind a reverse proxy every client shares one IP, so configure trusted proxies and key on ClientIP then
var (
	loginMu       sync.Mutex
	loginFailures = map[string]*loginAttempts{}
)

// reserveLoginAttempt counts the attempt before the slow passkey check, so parallel requests can't slip past the limit
func reserveLoginAttempt(ip string) bool {
	loginMu.Lock()
	defer loginMu.Unlock()
	for k, a := range loginFailures {
		if time.Since(a.start) > loginWindow {
			delete(loginFailures, k)
		}
	}
	a := loginFailures[ip]
	if a == nil {
		a = &loginAttempts{start: time.Now()}
		loginFailures[ip] = a
	}
	if a.count >= maxLoginFailures {
		return false
	}
	a.count++
	return true
}

func clearLoginFailures(ip string) {
	loginMu.Lock()
	defer loginMu.Unlock()
	delete(loginFailures, ip)
}

func Login(c *gin.Context) {
	ip := c.RemoteIP()
	if !reserveLoginAttempt(ip) {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "too many attempts, try again in a minute"})
		return
	}

	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "passkey required"})
		return
	}

	result, err := service.Login(req.Passkey)
	if errors.Is(err, service.ErrInvalidPasskey) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	clearLoginFailures(ip)
	c.JSON(http.StatusOK, result)
}

func Me(c *gin.Context) {
	c.JSON(http.StatusOK, service.Session{Role: c.GetString("role")})
}

func SetAdminPasskey(c *gin.Context) {
	var req setPasskeyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "passkey must be at least 6 characters"})
		return
	}
	err := service.SetAdminPasskey(req.Passkey)
	if errors.Is(err, service.ErrPasskeyMatchesSuperAdmin) {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}
