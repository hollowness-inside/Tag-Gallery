package main

type Vault interface {
	AddItem(string, string, string, string) (int64, error)
	GetItems() ([]Item, error)
	Close() error
}
