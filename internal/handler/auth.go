package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/keren/pao-event-panel/internal/service"
)

type loginRequest struct {
	Passkey string `json:"passkey" binding:"required"`
}

type setPasskeyRequest struct {
	Passkey string `json:"passkey" binding:"required,min=6"`
}

func Login(c *gin.Context) {
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
