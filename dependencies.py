# scans through all files in the current directory tree
# looking for instaches of:
#       'https://onexys.herokuapp.com
#       'https://yale.instructure.com
#
# print out the list of files which contained these.
# this info is used to change dependencies to your
# institution's own heroku / instructure systems

import os

def get_file_list(cwd):
    dir_contents = os.listdir(cwd)
    file_list = []
    for dir_item in dir_contents:
        full_path = os.path.join(cwd, dir_item)
        # If entry is a directory then get the list of files in this directory
        if os.path.isdir(full_path):
            file_list = file_list + get_file_list(full_path)
        else:
            file_list.append(full_path)

    return file_list


blacklist = ['.git', '.png', '.jpg', '.svg', '.pdf', 'mongodb_backups', 'dependencies.py']

for f in get_file_list(os.getcwd()):
    # exclude many file types from this edit
    bad = False
    string = str(f)
    for b in blacklist:
        if b in string:
            bad = True
            break
    if bad:
        continue
    # end exclusion

    with open(f, 'r', encoding='latin-1') as contents:
        contents = contents.read()
        if 'lucky_bulldogs' in contents:
            print(f)
