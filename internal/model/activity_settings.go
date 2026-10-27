package model

import "time"

type ActivitySettings struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	ActivityName    string    `gorm:"size:128;not null" json:"activity_name"`
	LogoPath        string    `gorm:"size:512" json:"logo_path"`
	// Light mode background
	BgMode          string    `gorm:"size:16;not null;default:solid" json:"bg_mode"`
	BgColor         string    `gorm:"size:7" json:"bg_color"`
	BgGradientStart string    `gorm:"size:7" json:"bg_gradient_start"`
	BgGradientEnd   string    `gorm:"size:7" json:"bg_gradient_end"`
	BgGradientAngle int       `gorm:"default:135" json:"bg_gradient_angle"`
	BgImagePath     string    `gorm:"size:512" json:"bg_image_path"`
	BgBlur          bool      `gorm:"default:false" json:"bg_blur"`
	// Dark mode background
	DarkBgMode          string `gorm:"size:16;not null;default:solid" json:"dark_bg_mode"`
	DarkBgColor         string `gorm:"size:7" json:"dark_bg_color"`
	DarkBgGradientStart string `gorm:"size:7" json:"dark_bg_gradient_start"`
	DarkBgGradientEnd   string `gorm:"size:7" json:"dark_bg_gradient_end"`
	DarkBgGradientAngle int    `gorm:"default:135" json:"dark_bg_gradient_angle"`
	DarkBgImagePath     string `gorm:"size:512" json:"dark_bg_image_path"`
	DarkBgBlur          bool   `gorm:"default:false" json:"dark_bg_blur"`
	// Light mode colors
	PrimaryColor    string    `gorm:"size:7;not null;default:#7CB99A" json:"primary_color"`
	SecondaryColor  string    `gorm:"size:7;not null;default:#e8e8ed" json:"secondary_color"`
	AccentColor     string    `gorm:"size:7;not null;default:#9ABBE0" json:"accent_color"`
	MutedColor      string    `gorm:"size:7;not null;default:#A0AEC0" json:"muted_color"`
	// Dark mode colors
	DarkPrimaryColor   string `gorm:"size:7;not null;default:#8ECFAB" json:"dark_primary_color"`
	DarkSecondaryColor string `gorm:"size:7;not null;default:#252833" json:"dark_secondary_color"`
	DarkAccentColor    string `gorm:"size:7;not null;default:#A8C8E8" json:"dark_accent_color"`
	DarkMutedColor     string `gorm:"size:7;not null;default:#5c6173" json:"dark_muted_color"`
	// Card glass effect
	CardOpacity     int `gorm:"default:90" json:"card_opacity"`      // 0-100
	CardBlur        int `gorm:"default:12" json:"card_blur"`         // 0-24 px
	DarkCardOpacity int `gorm:"default:85" json:"dark_card_opacity"` // 0-100
	DarkCardBlur    int `gorm:"default:16" json:"dark_card_blur"`    // 0-24 px
	// Weather
	WeatherLocation string `gorm:"size:128" json:"weather_location"` // City name or empty for IP-based
	// Admin login; never serialized, and not in UpdateActivity's allowed fields
	AdminPasskeyHash    string `gorm:"size:255" json:"-"`
	AdminPasskeyVersion int    `gorm:"not null;default:0" json:"-"`
	UpdatedAt       time.Time `json:"updated_at"`
}

var DefaultActivitySettings = ActivitySettings{
	ID:              1,
	ActivityName:    "Campus Event",
	BgMode:          "gradient",
	BgColor:         "#f5f5f7",
	BgGradientStart: "#ffffff",
	BgGradientEnd:   "#e8e8ed",
	BgGradientAngle: 135,
	DarkBgMode:          "gradient",
	DarkBgColor:         "#0f1117",
	DarkBgGradientStart: "#1a1c25",
	DarkBgGradientEnd:   "#0f1117",
	DarkBgGradientAngle: 135,
	PrimaryColor:    "#7CB99A",
	SecondaryColor:  "#e8e8ed",
	AccentColor:     "#9ABBE0",
	MutedColor:      "#A0AEC0",
	DarkPrimaryColor:   "#8ECFAB",
	DarkSecondaryColor: "#252833",
	DarkAccentColor:    "#A8C8E8",
	DarkMutedColor:     "#5c6173",
	CardOpacity:        90,
	CardBlur:           12,
	DarkCardOpacity:    85,
	DarkCardBlur:       16,
}
