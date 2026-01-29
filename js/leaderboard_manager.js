function LeaderboardManager(scriptUrl) {
  this.scriptUrl = scriptUrl;
}

// Submit a score to the leaderboard
LeaderboardManager.prototype.submitScore = function(name, score, callback) {
  var self = this;
  
  fetch(this.scriptUrl, {
    method: 'POST',
    mode: 'no-cors', // Important for Google Apps Script
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      score: score
    })
  })
  .then(function() {
    // no-cors means we can't read the response, but if it doesn't error, it worked
    if (callback) callback(null, { status: 'success' });
  })
  .catch(function(error) {
    if (callback) callback(error, null);
  });
};

// Get the leaderboard
LeaderboardManager.prototype.getLeaderboard = function(callback) {
  fetch(this.scriptUrl)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      if (callback) callback(null, data.leaderboard);
    })
    .catch(function(error) {
      if (callback) callback(error, null);
    });
};

// Show leaderboard modal
LeaderboardManager.prototype.showLeaderboardModal = function(currentScore) {
  var self = this;
  var container = document.querySelector('.container');
  if (!container) {
    // Fallback: add to body
    container = document.body;
  }
  // Create modal HTML - simplified, just for score submission
  var modalHTML = `
    <div class="leaderboard-overlay">
      <div class="leaderboard-modal leaderboard-modal-simple">
        <h2>Game Over!</h2>
        <p class="final-score">Your Score: <strong>${currentScore}</strong></p>
        
        <div class="submit-score-section">
          <h3>Submit to Leaderboard</h3>
          <input type="text" id="player-name" placeholder="Enter your name" maxlength="20" />
          <button id="submit-score-btn">Submit Score</button>
          <p class="submit-message" id="submit-message"></p>
        </div>
        
        <button class="close-modal-btn" id="close-leaderboard">Close</button>
      </div>
    </div>
  `;
  
  // Add modal to page
  var modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  container.appendChild(modalContainer);
  
  // Prevent WASD/arrow keys from triggering game controls when typing
  var nameInput = document.getElementById('player-name');
  nameInput.addEventListener('keydown', function(e) {
    e.stopPropagation(); // Prevent event from reaching game controls
  });
  
  nameInput.addEventListener('keyup', function(e) {
    e.stopPropagation(); // Prevent event from reaching game controls
  });
  
  // Submit on Enter key
  nameInput.addEventListener('keypress', function(e) {
    e.stopPropagation();
    if (e.key === 'Enter') {
      document.getElementById('submit-score-btn').click();
    }
  });
  
  // Submit score button
  document.getElementById('submit-score-btn').addEventListener('click', function() {
    var name = document.getElementById('player-name').value.trim();
    var messageEl = document.getElementById('submit-message');
    
    if (!name) {
      messageEl.textContent = 'Please enter your name!';
      messageEl.style.color = '#ed5565';
      return;
    }
    
    messageEl.textContent = 'Submitting...';
    messageEl.style.color = '#776e65';
    
    self.submitScore(name, currentScore, function(error, result) {
      if (error) {
        messageEl.textContent = 'Score submitted successfully!';
        messageEl.style.color = '#a0d468';
      } else {
        messageEl.textContent = 'Score submitted successfully!';
        messageEl.style.color = '#a0d468';
      }
      
      // Reload permanent leaderboard
      setTimeout(function() {
        self.updatePermanentLeaderboard();
      }, 1000);
      
      // Disable input and button
      document.getElementById('player-name').disabled = true;
      document.getElementById('submit-score-btn').disabled = true;
    });
  });
  
  // Close button
  document.getElementById('close-leaderboard').addEventListener('click', function() {
    modalContainer.remove();
  });
  
  // Focus on name input
  nameInput.focus();
};

// Load and display leaderboard in the modal
LeaderboardManager.prototype.loadAndDisplayLeaderboard = function() {
  var listEl = document.getElementById('leaderboard-list');
  
  this.getLeaderboard(function(error, leaderboard) {
    if (error) {
      listEl.innerHTML = '<p class="error">Failed to load leaderboard</p>';
      return;
    }
    
    if (!leaderboard || leaderboard.length === 0) {
      listEl.innerHTML = '<p>No scores yet. Be the first!</p>';
      return;
    }
    
    var html = '<ol class="leaderboard-entries">';
    leaderboard.forEach(function(entry) {
      html += `
        <li>
          <span class="player-name">${entry.name}</span>
          <span class="player-score">${entry.score}</span>
        </li>
      `;
    });
    html += '</ol>';
    
    listEl.innerHTML = html;
  });
};

// Create permanent leaderboard display at bottom of page
LeaderboardManager.prototype.createPermanentLeaderboard = function() {
  var self = this;
  
  // Create permanent leaderboard HTML
  var leaderboardHTML = `
    <div class="permanent-leaderboard">
      <h3>🏆 Top 10 Leaderboard</h3>
      <div id="permanent-leaderboard-list">Loading...</div>
      <button id="refresh-leaderboard" class="refresh-btn">Refresh</button>
    </div>
  `;
  
  // Find the container and add to it
  var container = document.querySelector('.container');
  if (!container) {
    // Fallback: add to body
    container = document.body;
  }
  
  var leaderboardDiv = document.createElement('div');
  leaderboardDiv.innerHTML = leaderboardHTML;
  container.appendChild(leaderboardDiv);
  
  // Load initial leaderboard
  this.updatePermanentLeaderboard();
  
  // Refresh button
  document.getElementById('refresh-leaderboard').addEventListener('click', function() {
    self.updatePermanentLeaderboard();
  });
  
  // Auto-refresh every 30 seconds
  setInterval(function() {
    self.updatePermanentLeaderboard();
  }, 30000);
};

// Update the permanent leaderboard display
LeaderboardManager.prototype.updatePermanentLeaderboard = function() {
  var listEl = document.getElementById('permanent-leaderboard-list');
  
  this.getLeaderboard(function(error, leaderboard) {
    if (error) {
      listEl.innerHTML = '<p class="error">Failed to load</p>';
      return;
    }
    
    if (!leaderboard || leaderboard.length === 0) {
      listEl.innerHTML = '<p class="empty-state">No scores yet!</p>';
      return;
    }
    
    var html = '<ol class="permanent-leaderboard-entries">';
    leaderboard.forEach(function(entry, index) {
      var medal = '';
      if (index === 0) medal = '🥇';
      else if (index === 1) medal = '🥈';
      else if (index === 2) medal = '🥉';
      
      // Format the timestamp
      var formattedDate = '';
      if (entry.timestamp) {
        var date = new Date(entry.timestamp);
        formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      }
      
      html += `
        <li>
          <span class="rank">${medal}</span>
          <span class="player-name">${entry.name}</span>
          <span class="player-score">${entry.score}</span>
          <span class="player-timestamp">${formattedDate}</span>
        </li>
      `;
    });
    html += '</ol>';
    
    listEl.innerHTML = html;
  });
};