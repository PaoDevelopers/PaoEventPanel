// Package relay is the house relay ranking plugin: lap counts kept per house, separate from student laps.
// To remove it, delete this folder and its Register call in the router; the relay_scores table can stay.
package relay

import (
	"errors"
	"log"
	"net/http"
	"sort"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/keren/pao-event-panel/internal/database"
	"github.com/keren/pao-event-panel/internal/model"
)

type Score struct {
	HouseID uint `gorm:"primaryKey;autoIncrement:false"`
	Laps    int  `gorm:"not null;default:0"`
}

func (Score) TableName() string { return "relay_scores" }

type Ranking struct {
	HouseID uint   `json:"house_id"`
	Name    string `json:"name"`
	Color   string `json:"color"`
	Laps    int    `json:"laps"`
	Rank    int    `json:"rank"`
}

type addLapsRequest struct {
	Delta int `json:"delta" binding:"required"`
}

type setLapsRequest struct {
	Laps *int `json:"laps" binding:"required,min=0"`
}

func Register(api, admin, superAdmin *gin.RouterGroup) {
	if err := database.DB.AutoMigrate(&Score{}); err != nil {
		log.Fatalf("Failed to migrate relay plugin: %v", err)
	}
	api.GET("/relay", list)
	admin.POST("/relay/:houseId/laps", addLaps)
	admin.PUT("/relay/:houseId/laps", setLaps)
	superAdmin.DELETE("/relay", reset)
}

func list(c *gin.Context) {
	var houses []model.House
	if err := database.DB.Find(&houses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var scores []Score
	if err := database.DB.Find(&scores).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	laps := make(map[uint]int, len(scores))
	for _, s := range scores {
		laps[s.HouseID] = s.Laps
	}

	rankings := make([]Ranking, 0, len(houses))
	for _, h := range houses {
		rankings = append(rankings, Ranking{HouseID: h.ID, Name: h.Name, Color: h.Color, Laps: laps[h.ID]})
	}
	sort.SliceStable(rankings, func(i, j int) bool { return rankings[i].Laps > rankings[j].Laps })
	// Ties share a rank: 1, 1, 3
	for i := range rankings {
		if i > 0 && rankings[i].Laps == rankings[i-1].Laps {
			rankings[i].Rank = rankings[i-1].Rank
		} else {
			rankings[i].Rank = i + 1
		}
	}
	c.JSON(http.StatusOK, rankings)
}

// houseID returns the :houseId param after checking the house exists, or writes the error response
func houseID(c *gin.Context) (uint, bool) {
	id, err := strconv.ParseUint(c.Param("houseId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid house id"})
		return 0, false
	}
	if err := database.DB.First(&model.House{}, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "house not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return 0, false
	}
	return uint(id), true
}

func addLaps(c *gin.Context) {
	id, ok := houseID(c)
	if !ok {
		return
	}
	var req addLapsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Single upsert so concurrent taps can't lose an update; laps never go below 0
	err := database.DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "house_id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"laps": gorm.Expr("CASE WHEN relay_scores.laps + ? < 0 THEN 0 ELSE relay_scores.laps + ? END", req.Delta, req.Delta),
		}),
	}).Create(&Score{HouseID: id, Laps: max(req.Delta, 0)}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	list(c)
}

func setLaps(c *gin.Context) {
	id, ok := houseID(c)
	if !ok {
		return
	}
	var req setLapsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "laps must be 0 or more"})
		return
	}

	err := database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "house_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"laps"}),
	}).Create(&Score{HouseID: id, Laps: *req.Laps}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	list(c)
}

func reset(c *gin.Context) {
	if err := database.DB.Where("1 = 1").Delete(&Score{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	list(c)
}
