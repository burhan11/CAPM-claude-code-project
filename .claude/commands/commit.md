Commit the current work and push it to the remote.

Before committing:
1. Make sure a .gitignore exists at the repo root covering SAP CAP/UI5 artifacts:
   - node_modules/
   - gen/
   - mta_archives/
   - *.mtar
   - default-env.json
   - default-*.json
   - .env
   - *.db, *.sqlite
   - .cds-lint cache, dist/, coverage/
2. Run `git status` and `git diff` to show me what will be committed and review changes. 
3. Flag anything that looks like a secret, credential, or generated build artifact so I can
   confirm before it goes in.
3. Also suggest any files/folders to be included in .gitignore file

Then:
3. Stage the intended files using `git add .`.
4. Suggest a clear commit message in imperative mood, e.g.
   "Add <Entity> data model and Fiori Elements list report".
   And wait for my confirmation which commit message to choose from, also
   ask if I want to provide any commit message
5. After confirmation
    - Run `git commit -m "choosen-message"`
    - Push to <branch> on origin.

If there's no remote or no branch yet, tell me the exact commands you'd run
and ask before creating anything.