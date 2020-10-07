# suptg-quest-markup
Userscript to assist abstraction of a suptg archived thread into a data format suitable for other purposes

Install from one of the files in `/dest`

Visiting a thread on suptg will now see posts change colour, with a vague attempt at doing this automatically.
These colours determine how the post should be handled when the EXPORT button is clicked.

- red: the post is a QM post
- blue: the post is a player comment
- purple: the post is a vote
- translucent: the post will be discarded entirely

You can click on a post to cycle through these colours, and will likely need to do so to put the thread in a state ready for export.

After EXPORT is clicked it should download a text file containing a JSON representation of the thread data.
This can then be handled by other software, eg. being imported into Akun using my `akun-importer`.
