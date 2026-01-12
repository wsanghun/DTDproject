export async function extractPathFromImage(imgSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imgSrc;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const path = [];

      for (let y = 0; y < canvas.height; y += 6) {
        let sumX = 0;
        let count = 0;

        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // 밝은 사막길 범위
          if (
            r >= 180 &&
            r <= 240 &&
            g >= 160 &&
            g <= 220 &&
            b >= 120 &&
            b <= 180
          ) {
            sumX += x;
            count++;
          }
        }

        if (count > 20) {
          const centerX = Math.floor(sumX / count);
          path.push({ x: centerX, y });
        }
      }

      resolve(path);
    };
  });
}
