document.getElementById('shortenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const urlInput = document.getElementById('urlInput');
    const resultDiv = document.getElementById('result');
    const url = urlInput.value.trim();
  
    if (!url) return;
  
    try {
      const response = await fetch(`/create?url=${encodeURIComponent(url)}`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Error creating short URL');
      
      const id = await response.text();
      const shortUrl = `${window.location.origin}/short/${id}`;
      
      resultDiv.innerHTML = `
        <div class="success">
          Short URL created!<br>
          <a href="${shortUrl}" target="_blank">${shortUrl}</a>
        </div>
      `;
      
      urlInput.value = '';
    } catch (error) {
      resultDiv.innerHTML = `<div class="error">${error.message}</div>`;
    }
  });