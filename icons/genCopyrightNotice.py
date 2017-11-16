import os

even = True

def splitOnTagclose(x):
    global even
    if not even:
        even = True
        return x.split(">")[1]
    else:
        even = False
        return ""

def splitOnEndTag(x):
    return x.split("</text>")[0]

print ("<table id=\"copyrightNoticeIcons\">")

for file_ in os.listdir("."):
    currentFile = ""
    if file_.endswith(".svg"):
        with open(file_, "r") as f:
            currentFile = f.read()
        even = True
        currentFile = " ".join((map(splitOnEndTag, map(splitOnTagclose,currentFile.split("<text"))))).strip()
    if (currentFile != ""):
        print("<tr><td><img src=\"../icons/" + file_ + "\"></td><td>" + currentFile + "</td></tr>")

print("</table>")
