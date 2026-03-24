const API_CONFIG = {
  baseUrl: window.BODMAS_API_BASE_URL || "",
  endpoints: {
    saveScore: "php/save_score.php",
    leaderboard: "php/get_leaderboard.php"
  }
};

function buildApiUrl(path) {
  if (!API_CONFIG.baseUrl) return path;
  return `${API_CONFIG.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function sendScore(name, score) {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.endpoints.saveScore), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        score
      })
    });

    if (!response.ok) {
      throw new Error(`Save score failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

async function fetchLeaderboard() {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.endpoints.leaderboard), {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Leaderboard request failed with status ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data.scores) ? data.scores : [];
  } catch (error) {
    return [];
  }
}
