async function refreshAccessToken() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing YouTube OAuth env vars: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    throw new Error(`YouTube OAuth refresh failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function youtubeFetch(path, accessToken) {
  const response = await fetch(`https://www.googleapis.com/youtube/v3/${path}`, {
    headers: {
      authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`YouTube API request failed: ${response.status}`);
  }

  return response.json();
}

async function getUploadsPlaylistId(accessToken) {
  if (process.env.YOUTUBE_UPLOADS_PLAYLIST_ID) {
    return process.env.YOUTUBE_UPLOADS_PLAYLIST_ID;
  }

  const channel = await youtubeFetch("channels?part=contentDetails&mine=true", accessToken);
  return channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
}

export async function fetchYouTubeUploads() {
  const accessToken = await refreshAccessToken();
  const playlistId = await getUploadsPlaylistId(accessToken);

  if (!playlistId) {
    throw new Error("Could not find YouTube uploads playlist");
  }

  const videos = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      part: "snippet,contentDetails,status",
      playlistId,
      maxResults: "50"
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const data = await youtubeFetch(`playlistItems?${params.toString()}`, accessToken);
    for (const item of data.items || []) {
      const id = item.contentDetails?.videoId;
      const title = item.snippet?.title;

      if (!id || !title || title === "Deleted video" || title === "Private video") {
        continue;
      }

      videos.push({
        id,
        title,
        url: `https://www.youtube.com/watch?v=${id}`,
        publishedAt: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || null
      });
    }

    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return videos.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
}
