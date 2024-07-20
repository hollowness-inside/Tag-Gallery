package main

// Item represents a record in the vault table
type Item struct {
	Id       int64    `json:"id"`
	Ext      string   `json:"extension"`
	Dir      string   `json:"directory"`
	Mimetype string   `json:"type"`
	Tags     []string `json:"tags"`
}
