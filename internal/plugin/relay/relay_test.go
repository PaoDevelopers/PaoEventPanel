package relay

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/keren/pao-event-panel/internal/database"
)

func setup(t *testing.T) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)
	if err := database.InitDB("sqlite", ":memory:"); err != nil {
		t.Fatal(err)
	}
	if err := database.Migrate(); err != nil {
		t.Fatal(err)
	}
	database.Seed()
	r := gin.New()
	api := r.Group("/api")
	// Auth is the router's job; the plugin only needs the groups
	Register(api, api, api)
	return r
}

func call(r *gin.Engine, method, path string, body any) (int, []Ranking) {
	var buf bytes.Buffer
	if body != nil {
		json.NewEncoder(&buf).Encode(body)
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	var out []Ranking
	json.Unmarshal(w.Body.Bytes(), &out)
	return w.Code, out
}

func laps(rankings []Ranking, houseID uint) int {
	for _, r := range rankings {
		if r.HouseID == houseID {
			return r.Laps
		}
	}
	return -1
}

func TestRelay(t *testing.T) {
	r := setup(t)

	code, out := call(r, "GET", "/api/relay", nil)
	if code != http.StatusOK || len(out) != 4 {
		t.Fatalf("list: got %d with %d houses", code, len(out))
	}
	for _, h := range out {
		if h.Laps != 0 || h.Rank != 1 {
			t.Fatalf("fresh house %s should be 0 laps at rank 1, got %+v", h.Name, h)
		}
	}

	call(r, "POST", "/api/relay/2/laps", map[string]int{"delta": 1})
	_, out = call(r, "POST", "/api/relay/2/laps", map[string]int{"delta": 1})
	if laps(out, 2) != 2 || out[0].HouseID != 2 || out[0].Rank != 1 || out[1].Rank != 2 {
		t.Fatalf("after +2 house 2 should lead with 2 laps, got %+v", out)
	}

	if _, out = call(r, "POST", "/api/relay/2/laps", map[string]int{"delta": -5}); laps(out, 2) != 0 {
		t.Fatalf("laps must not go below 0, got %d", laps(out, 2))
	}
	if _, out = call(r, "POST", "/api/relay/3/laps", map[string]int{"delta": -1}); laps(out, 3) != 0 {
		t.Fatalf("first -1 must store 0, got %d", laps(out, 3))
	}

	if _, out = call(r, "PUT", "/api/relay/1/laps", map[string]int{"laps": 7}); laps(out, 1) != 7 {
		t.Fatalf("set: expected 7, got %d", laps(out, 1))
	}
	if code, _ = call(r, "PUT", "/api/relay/1/laps", map[string]int{"laps": -1}); code != http.StatusBadRequest {
		t.Fatalf("negative set: expected 400, got %d", code)
	}
	if code, _ = call(r, "POST", "/api/relay/99/laps", map[string]int{"delta": 1}); code != http.StatusNotFound {
		t.Fatalf("unknown house: expected 404, got %d", code)
	}

	if _, out = call(r, "DELETE", "/api/relay", nil); laps(out, 1) != 0 {
		t.Fatalf("reset: expected 0, got %d", laps(out, 1))
	}
}
