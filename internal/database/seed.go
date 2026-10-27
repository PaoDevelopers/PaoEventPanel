package database

import (
	"log"

	"github.com/keren/pao-event-panel/internal/model"
)

func Seed() {
	seedHouses()
	seedActivitySettings()
}

func seedHouses() {
	for _, h := range model.DefaultHouses {
		var count int64
		DB.Model(&model.House{}).Where("code = ?", h.Code).Count(&count)
		if count == 0 {
			if err := DB.Create(&h).Error; err != nil {
				log.Printf("Failed to seed house %s: %v", h.Name, err)
			}
		}
	}
}

func seedActivitySettings() {
	var count int64
	DB.Model(&model.ActivitySettings{}).Count(&count)
	if count > 0 {
		return
	}

	settings := model.DefaultActivitySettings
	if err := DB.Create(&settings).Error; err != nil {
		log.Printf("Failed to seed activity settings: %v", err)
	}
}
