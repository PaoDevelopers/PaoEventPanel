package database

import "github.com/keren/pao-event-panel/internal/model"

func Migrate() error {
	// Individual accounts were replaced by shared passkeys
	if err := DB.Migrator().DropTable("users"); err != nil {
		return err
	}
	if DB.Migrator().HasColumn(&model.LapRecord{}, "admin_id") {
		if err := DB.Migrator().DropColumn(&model.LapRecord{}, "admin_id"); err != nil {
			return err
		}
	}
	return DB.AutoMigrate(
		&model.House{},
		&model.Student{},
		&model.LapRecord{},
		&model.ActivitySettings{},
		&model.ThemePreset{},
	)
}
