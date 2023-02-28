commit e9c563ec335f69568c3414ee4d35b3ea04dd2dcb
Author: saber2pr <saber2pr@gmail.com>
Date:   Mon Aug 29 10:16:47 2022 +0800

    chore: update

 README.md | 46 ++++++++++++++++++++++++++++++++++++++++++++++
 1 file changed, 46 insertions(+)
    '--pretty=medium',
  authorName: string
  authorEmail: string
  date: string

    if (/^commit/.test(line)) {
      nodes.push({} as any)
    }

    const item = nodes[nodes.length - 1]
    if (!item) {
      continue
    }

    if (/^commit/.test(line)) {
      item.commit = line.split(' ')[1]
    }
    if (/^Author/.test(line)) {
      const meta = line.split(' ')
      item.authorName = meta[1]
      item.authorEmail = meta[2].replace(/[<>]/g, '')
    }
    if (/^Date/.test(line)) {
      const str = line.replace('Date:', '').trim()
      item.date = str
    }
    if (/^ {4}/.test(line)) {
      item.title = line.trim()
    }
    if (/^ {1}/.test(line)) {
