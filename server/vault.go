package main

import "io"

type Vault interface {
	UploadItem(string, []string, io.ReadSeeker) error
	GetItems() ([]Item, error)
	Close() error
}
