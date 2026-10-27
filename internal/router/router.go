package router

import (
	"github.com/gin-gonic/gin"

	"github.com/keren/pao-event-panel/internal/handler"
	"github.com/keren/pao-event-panel/internal/middleware"
	"github.com/keren/pao-event-panel/internal/plugin/relay"
)

func Setup(r *gin.Engine) {
	r.Use(middleware.CORS())

	api := r.Group("/api")

	// Public routes
	api.POST("/auth/login", handler.Login)
	api.GET("/rankings/houses", handler.HouseRankings)
	api.GET("/rankings/students", handler.StudentRankings)
	api.GET("/rankings/stats", handler.RankingStats)
	api.GET("/activity", handler.GetActivity)
	api.GET("/students", handler.ListStudents)

	// Admin routes
	admin := api.Group("")
	admin.Use(middleware.AuthRequired(), middleware.RoleRequired("admin", "super_admin"))
	{
		admin.GET("/auth/me", handler.Me)
		admin.POST("/students", handler.CreateStudent)
		admin.PUT("/students/:id", handler.UpdateStudent)
		admin.DELETE("/students/:id", handler.DeleteStudent)
		admin.POST("/students/:id/laps", handler.AddLaps)
		admin.PUT("/students/:id/laps", handler.SetLaps)
		admin.GET("/autocomplete/search", handler.SearchStudentDirectory)
	}

	// Super admin routes
	superAdmin := api.Group("")
	superAdmin.Use(middleware.AuthRequired(), middleware.RoleRequired("super_admin"))
	{
		superAdmin.PUT("/activity", handler.UpdateActivity)
		superAdmin.POST("/upload/logo", handler.UploadLogo)
		superAdmin.POST("/upload/background", handler.UploadBackground)
		superAdmin.PUT("/auth/admin-passkey", handler.SetAdminPasskey)
		superAdmin.GET("/houses", handler.ListHouses)
		superAdmin.PUT("/houses/:id/color", handler.UpdateHouseColor)
		superAdmin.POST("/theme-presets/builtin/apply", handler.ApplyBuiltinPreset)
		superAdmin.GET("/theme-presets", handler.ListThemePresets)
		superAdmin.POST("/theme-presets", handler.CreateThemePreset)
		superAdmin.DELETE("/theme-presets/:id", handler.DeleteThemePreset)
		superAdmin.POST("/theme-presets/:id/apply", handler.ApplyThemePreset)
		superAdmin.GET("/export/rankings", handler.ExportRankings)
		superAdmin.GET("/autocomplete/status", handler.GetDirectoryStatus)
		superAdmin.GET("/autocomplete/template", handler.DownloadDirectoryTemplate)
		superAdmin.POST("/autocomplete/upload", handler.UploadStudentDirectory)
	}

	relay.Register(api, admin, superAdmin)

	// Static files for uploads
	r.Static("/uploads", "./uploads")
}
