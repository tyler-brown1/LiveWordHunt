class Trie {
    constructor() {
      this.root = {};
    }
  
    insert(word) {
      let node = this.root;
      for (let c of word) {
        if (node[c] == null) node[c] = {};
        node = node[c];
      }
      node.isWord = true;
    }
  
    traverse(word) {
      let node = this.root;
      for (let c of word) {
        node = node[c];
        if (node == null) return null;
      }
      return node;
    }
  
    search(word) {
      const node = this.traverse(word);
      return node != null && node.isWord === true;
    }
}

const fs = require('fs');

const data = fs.readFileSync('dictionary.txt', 'utf8');

// Split the content by new lines
const lines = data.split(/\r?\n/);

const trie = new Trie();
// Iterate over each line
lines.forEach((line, index) => {
  trie.insert(line)
});

function findWords(board) {
  const numRows = board.length;
  const numCols = board[0].length;
  const result = new Set();

  function dfs(row, col, node, path,len) {
      if (node.isWord && len>2) {
          result.add(path);
      }

      if (row < 0 || row >= numRows || col < 0 || col >= numCols || !board[row][col] || !node[board[row][col]]) {
          return;
      }

      const char = board[row][col];
      board[row][col] = null;  // Mark the cell as visited
      const nextNode = node[char];
      
      const directions = [
          [0, 1], [1, 0], [0, -1], [-1, 0],
          [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];

      for (const [dx, dy] of directions) {
          dfs(row + dx, col + dy, nextNode, path + char,len+1);
      }

      board[row][col] = char;  // Unmark the cell
  }

  for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
          if (trie.root[board[r][c]]) {
              dfs(r, c, trie.root, '',0);
          }
      }
  }

  return Array.from(result);
}

module.exports = { trie, findWords};