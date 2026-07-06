"use client";

import { useState, useRef } from "react";

// Categorized and Alphabetized TONES
const CATEGORIZED_TONES = {
    animals: {
        title: "Animals",
        items: [
            "bird", "cat", "cow", "dog", "donkey", "elephant", "fish", "goat",
            "horse", "lion", "monkey", "mouse", "rabbit", "sheep", "snake", "tiger", "text", "zebra"
        ].sort(),
    },
    actions: {
        title: "Actions",
        items: [
            "crying", "falling", "kicking", "playing", "running",
            "smashing", "striking", "teaching", "relaxing", "kissing", "flying",
            "riding bicycle", "biting", "writing", "meditating", "exercising", "jumping", "shooting",
            "spinning"
        ].sort(),
    },
    emotions: {
        title: "Emotions",
        items: [
            "afraid", "angry", "celebratory", "happy", "hopeful",
            "humorous", "laughing", "lighthearted", "melancholic", "prejudice",
            "romance", "sarcastic", "serious", "welcoming", "peaceful", "amazement", "love",
            "hate"
        ].sort(),
    },
    industries: {
        title: "Industries",
        items: [
            "agriculture", "educational", "entertainment", "financial", "healthcare",
            "legal", "manufacturing", "military", "mining", "nonprofit",
            "politics", "real estate", "technology", "transport"
        ].sort(),
    },
    sports: {
        title: "Sports & Athletics",
        items: [
            "american-football", "athletics", "baseball", "basketball", "boxing",
            "cricket", "cycling", "esports", "golf", "gymnastics",
            "karate", "marathon", "motorsport", "rugby", "skiing",
            "soccer", "sports", "surfing", "swimming", "tennis",
            "volleyball", "wrestling"
        ].sort(),
    },
    transportation: {
        title: "Transportation",
        items: [
            "airplane", "bicycle", "boat", "bus", "car", "delivery truck", "drone",
            "helicopter", "motorbike", "scooter", "ship", "spaceship", "submarine",
            "train", "tram", "truck", "van", "yacht"
        ].sort(),
    }
};

export default function UploadLottie() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTagChange = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleUpload = async () => {
    if (!file || selectedTags.length === 0) {
      alert("Please select a file and at least one tag.");
      return;
    }
  
    // Read and parse the Lottie file to extract metadata
    const fileContent = await file.text();
    let duration: number;
    let frameRate: number;

    try {
        const lottieData = JSON.parse(fileContent);
        if (
          typeof lottieData.op === "undefined" ||
          typeof lottieData.ip === "undefined" ||
          typeof lottieData.fr === "undefined"
        ) {
          throw new Error("Missing required Lottie properties (op, ip, or fr)");
        }
        duration = (lottieData.op - lottieData.ip) / lottieData.fr;
        frameRate = lottieData.fr;      
        } catch (e) {
        console.error("Failed to parse Lottie metadata", e);
        alert("Invalid Lottie file - could not extract animation metadata");
        return;
    }

    // Validate the calculated values
    if (isNaN(duration) || isNaN(frameRate) || duration <= 0 || frameRate <= 0) {
        alert("Invalid Lottie file - could not extract animation metadata");
        return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tones", JSON.stringify(selectedTags));
    formData.append("duration", duration.toString());
    formData.append("frameRate", frameRate.toString());

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/lottie-upload`, {
      method: "POST",
      body: formData,
    });

    // const data = await res.json();

    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error("Invalid JSON response", e);
      alert("Upload failed: Invalid server response");
      return;
    }
    
    if (!res.ok) {
      alert(`Upload error: ${data?.error || "Unknown error"}`);
      return;
    }
    
    // Success
    console.log("Uploaded:", data);

    if (res.ok) {
      alert(data.message || "Upload complete.");

      // ✅ Reset state
      setFile(null);
      setSelectedTags([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      alert(data.error || "Upload failed.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Lottie Animation</h2>

      {/* Single file input box */}
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      <div style={{ marginTop: 20 }}>
        {Object.values(CATEGORIZED_TONES).map((category) => (
          <div key={category.title} style={{ marginBottom: 20 }}>
            <h3>{category.title}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {category.items.map((tag) => (
                <label
                  key={tag}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: `calc((100% / 5) - 8px)`, // Calculate width for 5 items in a row with gap
                    boxSizing: "border-box", // Include padding and border in the width
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(selectedTags.includes(tag))}
                    onChange={() => handleTagChange(tag)}
                    style={{ marginRight: 5 }}
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleUpload} style={{ marginTop: 20, padding: '10px 20px', cursor: 'pointer' }}>Upload</button>
    </div>
  );
}