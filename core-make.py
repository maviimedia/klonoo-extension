import os
import json
import re
import xml.etree.ElementTree as ET

def parse_package_json(filepath):
    dependencies = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if 'dependencies' in data:
                dependencies.extend(data['dependencies'].keys())
            if 'devDependencies' in data:
                dependencies.extend(data['devDependencies'].keys())
    except Exception:
        pass
    return {"ecosystem": "Node.js", "libraries": dependencies}

def parse_requirements_txt(filepath):
    dependencies = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    match = re.split(r'[=<>~]', line)
                    if match:
                        dependencies.append(match[0].strip())
    except Exception:
        pass
    return {"ecosystem": "Python", "libraries": dependencies}

def parse_composer_json(filepath):
    dependencies = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if 'require' in data:
                dependencies.extend(data['require'].keys())
            if 'require-dev' in data:
                dependencies.extend(data['require-dev'].keys())
    except Exception:
        pass
    return {"ecosystem": "PHP", "libraries": dependencies}

def parse_pom_xml(filepath):
    dependencies = []
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
        namespace = ""
        if root.tag.startswith('{'):
            namespace = root.tag.split('}')[0] + '}'
        for dep in root.findall(f".//{namespace}dependency"):
            artifact = dep.find(f"{namespace}artifactId")
            if artifact is not None and artifact.text:
                dependencies.append(artifact.text)
    except Exception:
        pass
    return {"ecosystem": "Java", "libraries": dependencies}
    
def parse_go_mod(filepath):
    dependencies = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            in_require_block = False
            for line in f:
                line = line.strip()
                if line.startswith("require ("):
                    in_require_block = True
                    continue
                if in_require_block and line == ")":
                    in_require_block = False
                    continue
                if in_require_block and line:
                    parts = line.split()
                    if parts:
                        dependencies.append(parts[0])
                elif line.startswith("require "):
                    parts = line.split()
                    if len(parts) >= 2:
                        dependencies.append(parts[1])
    except Exception:
        pass
    return {"ecosystem": "Go", "libraries": dependencies}

def analyze_project(directory):
    report = {}
    
    file_parsers = {
        'package.json': parse_package_json,
        'requirements.txt': parse_requirements_txt,
        'composer.json': parse_composer_json,
        'pom.xml': parse_pom_xml,
        'go.mod': parse_go_mod
    }
    
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d not in {
            'node_modules', 'venv', 'env', '.venv', 'vendor', 
            '.git', 'target', 'build', 'dist', '.next', '.nuxt'
        }]
        
        for file in files:
            if file in file_parsers:
                filepath = os.path.join(root, file)
                parser_func = file_parsers[file]
                result = parser_func(filepath)
                
                if result['ecosystem'] not in report:
                    report[result['ecosystem']] = set()
                    
                report[result['ecosystem']].update(result['libraries'])
                
    return report

def generate_report(directory, output_file):
    report = analyze_project(directory)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        if not report:
            f.write("No recognized tech stack configuration files found.\n")
            return
            
        for ecosystem, libraries in report.items():
            f.write(f"[{ecosystem}]\n")
            if libraries:
                for lib in sorted(list(libraries)):
                    f.write(f"{lib}\n")
            else:
                f.write("No specific libraries extracted.\n")
            f.write("\n")

if __name__ == "__main__":
    generate_report(".", "Tech—Stack.txt")