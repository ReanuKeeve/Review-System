function createVideoCard(video) {
  const article = document.createElement("article");
  article.className = "video-card";

  article.innerHTML = `
    <div class="video-thumb-wrap">
      <img
        class="video-thumb"
        src="${video.thumbnail}"
        alt="${video.title}"
        loading="lazy"
      />
    </div>

    <div class="video-content">
      <h2 class="video-title">${video.title}</h2>

      <div class="video-actions">
        <a class="download-btn" href="${video.file}" download>
          Download
        </a>
        <a class="preview-btn" href="${video.file}" target="_blank">
          Open
        </a>
      </div>
    </div>
  `;

  return article;
}

function renderVideos() {
  const container = document.getElementById("video-list");

  if (!container) {
    console.error("video-list not found");
    return;
  }

  container.innerHTML = "";

  videos.forEach(video => {
    container.appendChild(createVideoCard(video));
  });
}

document.addEventListener("DOMContentLoaded", renderVideos);