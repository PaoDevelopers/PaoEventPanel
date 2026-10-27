package handler

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"

	"github.com/keren/pao-event-panel/internal/model"
)

var studentDirectoryPath = "data/students.db"

func SearchStudentDirectory(c *gin.Context) {
	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusOK, []model.StudentDirectoryEntry{})
		return
	}

	db, err := openDirectoryDB()
	if err != nil {
		c.JSON(http.StatusOK, []model.StudentDirectoryEntry{})
		return
	}
	defer db.Close()

	pattern := "%" + q + "%"
	rows, err := db.Query(
		`SELECT id, COALESCE(english_name, ''), COALESCE(chinese_name, ''), system_name
		 FROM students
		 WHERE id LIKE ? OR english_name LIKE ? OR chinese_name LIKE ? OR system_name LIKE ?
		 LIMIT 10`,
		pattern, pattern, pattern, pattern,
	)
	if err != nil {
		c.JSON(http.StatusOK, []model.StudentDirectoryEntry{})
		return
	}
	defer rows.Close()

	results := make([]model.StudentDirectoryEntry, 0)
	for rows.Next() {
		var entry model.StudentDirectoryEntry
		if err := rows.Scan(&entry.ID, &entry.EnglishName, &entry.ChineseName, &entry.SystemName); err != nil {
			continue
		}
		results = append(results, entry)
	}
	c.JSON(http.StatusOK, results)
}

func GetDirectoryStatus(c *gin.Context) {
	db, err := openDirectoryDB()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"loaded": false, "count": 0})
		return
	}
	defer db.Close()

	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM students").Scan(&count); err != nil {
		c.JSON(http.StatusOK, gin.H{"loaded": false, "count": 0})
		return
	}
	c.JSON(http.StatusOK, gin.H{"loaded": true, "count": count})
}

const directoryTemplateCSV = "id,name,grade,legal_sex\n" +
	"s22501,Chen Wei,Y9,F\n" +
	"s22502,Zhang Yu,Y10,F\n" +
	"s22503,Li Ming,Y11,M\n"

func DownloadDirectoryTemplate(c *gin.Context) {
	c.Header("Content-Disposition", `attachment; filename="students_template.csv"`)
	c.Data(http.StatusOK, "text/csv; charset=utf-8", []byte(directoryTemplateCSV))
}

// parseDirectoryCSV reads id and name columns (located by header); other columns are ignored
func parseDirectoryCSV(r io.Reader) ([]model.StudentDirectoryEntry, error) {
	reader := csv.NewReader(r)
	reader.FieldsPerRecord = -1
	reader.TrimLeadingSpace = true

	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("invalid CSV: missing header")
	}
	idCol, nameCol := -1, -1
	for i, h := range header {
		switch strings.ToLower(strings.TrimSpace(strings.TrimPrefix(h, "\uFEFF"))) {
		case "id":
			idCol = i
		case "name":
			nameCol = i
		}
	}
	if idCol < 0 || nameCol < 0 {
		return nil, fmt.Errorf("CSV header must include 'id' and 'name' columns")
	}

	entries := make([]model.StudentDirectoryEntry, 0)
	seen := map[string]int{}
	for row := 2; ; row++ {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("row %d: invalid CSV", row)
		}
		if len(record) == 1 && strings.TrimSpace(record[0]) == "" {
			continue
		}
		if len(record) <= idCol || len(record) <= nameCol {
			return nil, fmt.Errorf("row %d: missing columns", row)
		}
		id, name := strings.TrimSpace(record[idCol]), strings.TrimSpace(record[nameCol])
		if id == "" {
			return nil, fmt.Errorf("row %d: empty id", row)
		}
		if name == "" {
			return nil, fmt.Errorf("row %d: empty name", row)
		}
		if first, ok := seen[id]; ok {
			return nil, fmt.Errorf("row %d: duplicate id %q (first on row %d)", row, id, first)
		}
		seen[id] = row
		entries = append(entries, model.StudentDirectoryEntry{ID: id, SystemName: name})
	}
	if len(entries) == 0 {
		return nil, fmt.Errorf("CSV has no student rows")
	}
	return entries, nil
}

func UploadStudentDirectory(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
		return
	}

	if file.Size > 50*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file too large (max 50MB)"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
		return
	}
	defer src.Close()

	entries, err := parseDirectoryCSV(src)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := os.MkdirAll(filepath.Dir(studentDirectoryPath), 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create data directory"})
		return
	}

	// Build into a temp file and rename so searches never see a half-written directory
	tmpPath := studentDirectoryPath + ".tmp"
	os.Remove(tmpPath)
	if err := writeDirectoryDB(tmpPath, entries); err != nil {
		os.Remove(tmpPath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save directory"})
		return
	}
	if err := os.Rename(tmpPath, studentDirectoryPath); err != nil {
		os.Remove(tmpPath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save directory"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "uploaded", "count": len(entries)})
}

func writeDirectoryDB(path string, entries []model.StudentDirectoryEntry) error {
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return err
	}
	defer db.Close()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`CREATE TABLE students (
		id TEXT PRIMARY KEY,
		english_name TEXT,
		chinese_name TEXT,
		system_name TEXT NOT NULL
	)`); err != nil {
		return err
	}
	stmt, err := tx.Prepare("INSERT INTO students (id, system_name) VALUES (?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()
	for _, e := range entries {
		if _, err := stmt.Exec(e.ID, e.SystemName); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func openDirectoryDB() (*sql.DB, error) {
	if _, err := os.Stat(studentDirectoryPath); os.IsNotExist(err) {
		return nil, err
	}
	return sql.Open("sqlite3", filepath.Clean(studentDirectoryPath)+"?mode=ro")
}
