import os
import re
import sys

def is_binary(file_path):
    textchars = bytearray({7,8,9,10,12,13,27} | set(range(0x20, 0x100)) - {0x7f})
    def is_binary_string(bytes_to_check):
        return bool(bytes_to_check.translate(None, textchars))
    
    try:
        with open(file_path, 'rb') as f:
            return is_binary_string(f.read(1024))
    except:
        return True

def replace_pii(file_path):
    try:
        # Skip binary files and certain problematic files/directories
        if (is_binary(file_path) or 
            'vendor/' in file_path or 
            'node_modules/' in file_path or 
            '.git/' in file_path or
            '.history/' in file_path or
            'dist/' in file_path):
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace username
        content = content.replace('USER', 'USER')
        
        # Replace absolute paths
        content = re.sub(r'C:\\Users\\[^\\]+\\', '/USER_HOME/', content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def main():
    # Find all tracked files
    os.system('git ls-files > tracked_files.txt')
    
    with open('tracked_files.txt', 'r') as f:
        for line in f:
            file_path = line.strip()
            replace_pii(file_path)
    
    # Stage changes
    os.system('git add .')

if __name__ == '__main__':
    main()