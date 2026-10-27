package handler

// SetStudentDirectoryPath lets external tests keep the directory DB out of the source tree
func SetStudentDirectoryPath(p string) { studentDirectoryPath = p }
