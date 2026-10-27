package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/keren/pao-event-panel/internal/database"
	"github.com/keren/pao-event-panel/internal/model"
)

type createStudentRequest struct {
	StudentID string `json:"student_id"`
	Name      string `json:"name" binding:"required"`
	HouseID   uint   `json:"house_id" binding:"required"`
	LapCount  int    `json:"lap_count"`
}

type updateStudentRequest struct {
	StudentID *string `json:"student_id"`
	Name      string  `json:"name"`
	HouseID   uint    `json:"house_id"`
}

type addLapsRequest struct {
	Delta int `json:"delta" binding:"required"`
}

type setLapsRequest struct {
	LapCount int `json:"lap_count" binding:"required,gte=0"`
}

func ListStudents(c *gin.Context) {
	var students []model.Student
	query := database.DB.Preload("House")

	if houseID := c.Query("house_id"); houseID != "" {
		query = query.Where("house_id = ?", houseID)
	}

	if err := query.Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, students)
}

func CreateStudent(c *gin.Context) {
	var req createStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var house model.House
	if err := database.DB.First(&house, req.HouseID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid house_id"})
		return
	}

	student := model.Student{
		StudentID: req.StudentID,
		Name:      req.Name,
		HouseID:   req.HouseID,
		LapCount:  req.LapCount,
	}
	if err := database.DB.Create(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	database.DB.Preload("House").First(&student, student.ID)
	InvalidateRankingCache()
	c.JSON(http.StatusCreated, student)
}

func UpdateStudent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var student model.Student
	if err := database.DB.First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}

	var req updateStudentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.StudentID != nil {
		student.StudentID = *req.StudentID
	}
	if req.Name != "" {
		student.Name = req.Name
	}
	if req.HouseID != 0 {
		var house model.House
		if err := database.DB.First(&house, req.HouseID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid house_id"})
			return
		}
		student.HouseID = req.HouseID
	}

	if err := database.DB.Save(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	database.DB.Preload("House").First(&student, student.ID)
	InvalidateRankingCache()
	c.JSON(http.StatusOK, student)
}

func DeleteStudent(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := database.DB.Delete(&model.Student{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	InvalidateRankingCache()
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func AddLaps(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req addLapsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var student model.Student
	if err := database.DB.First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}

	newCount := student.LapCount + req.Delta
	if newCount < 0 {
		newCount = 0
	}

	tx := database.DB.Begin()

	student.LapCount = newCount
	if err := tx.Save(&student).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	record := model.LapRecord{
		StudentID: uint(id),
		Delta:     req.Delta,
	}
	if err := tx.Create(&record).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx.Commit()
	database.DB.Preload("House").First(&student, student.ID)
	InvalidateRankingCache()
	c.JSON(http.StatusOK, student)
}

func SetLaps(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req setLapsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var student model.Student
	if err := database.DB.First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}

	delta := req.LapCount - student.LapCount
	tx := database.DB.Begin()

	student.LapCount = req.LapCount
	if err := tx.Save(&student).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	record := model.LapRecord{
		StudentID: uint(id),
		Delta:     delta,
	}
	if err := tx.Create(&record).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	tx.Commit()
	database.DB.Preload("House").First(&student, student.ID)
	InvalidateRankingCache()
	c.JSON(http.StatusOK, student)
}
