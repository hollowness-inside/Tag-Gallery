package main

import "io"

type Vault interface {
	GetItem(int) ([]byte, string, error)
	GetThumbnail(int) ([]byte, string, error)
	UploadItem(string, string, []string, io.ReadSeeker) (int, error)
	GetItems() ([]Item, error)
	Close() error
}
