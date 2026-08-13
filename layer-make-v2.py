import os

def build_directory_tree(current_path, start_path, excluded_dirs, excluded_files):
    if current_path == start_path:
        node_name = os.path.basename(os.path.abspath(current_path))
    else:
        node_name = os.path.basename(current_path)
        
    tree_node = {'name': node_name, 'files': [], 'directories': []}
    
    directory_items = os.listdir(current_path)
    
    for item in sorted(directory_items):
        item_path = os.path.join(current_path, item)
        
        if os.path.isdir(item_path):
            if item not in excluded_dirs:
                child_node = build_directory_tree(item_path, start_path, excluded_dirs, excluded_files)
                if child_node['files'] or child_node['directories']:
                    tree_node['directories'].append(child_node)
        else:
            if item not in excluded_files:
                tree_node['files'].append(item)
                
    return tree_node

def write_tree_to_file(node, current_depth, file_handle):
    indentation = ' ' * 4 * current_depth
    file_handle.write(f"{indentation}{node['name']}/\n")
    
    file_indentation = ' ' * 4 * (current_depth + 1)
    for filename in node['files']:
        file_handle.write(f"{file_indentation}{filename}\n")
        
    for child_dir in node['directories']:
        write_tree_to_file(child_dir, current_depth + 1, file_handle)

def generate_directory_tree(start_directory, excluded_folders, excluded_files, output_filename):
    tree = build_directory_tree(start_directory, start_directory, excluded_folders, excluded_files)
    
    with open(output_filename, 'w', encoding='utf-8') as file_handle:
        if tree['files'] or tree['directories']:
            write_tree_to_file(tree, 0, file_handle)

if __name__ == "__main__":
    folders_to_exclude = {
        'node_modules', '.next', '.nuxt', 'dist', 'build', 'out', '.svelte-kit', 
        '.expo', 'coverage', 'bower_components', '.turbo', '.vercel',
        '__pycache__', 'venv', 'env', '.venv', '.pytest_cache', 
        '.tox', '.mypy_cache', '.ruff_cache', 'eggs', '.eggs',
        'target', '.gradle', '.m2',
        'bin', 'obj', '.vs',
        'vendor', 'Debug', 'Release',
        '.bundle',
        '.git', '.vscode', '.idea', '.eclipse', '.cache', 'logs', 'tmp', 'temp'
    }
    
    files_to_exclude = {
        'layer-make-v2.py',
        'Project—Structure.txt',
        'core-make.py',
        '.DS_Store', 
        'Thumbs.db',
        '.env'
    }
    
    generate_directory_tree('.', folders_to_exclude, files_to_exclude, 'Project—Structure.txt')