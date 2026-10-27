package model

import "time"

type LapRecord struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StudentID uint      `gorm:"not null;index" json:"student_id"`
	Delta     int       `gorm:"not null" json:"delta"`
	CreatedAt time.Time `json:"created_at"`
}
