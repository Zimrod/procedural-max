"use client";

export default function TestFetch() {
  const testFetch = async () => {
    console.log("START");

    try {
      const response = await fetch(
        "https://procedural-backend.onrender.com/script",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "Explain inflation in 30 seconds",
          }),
        }
      );

      console.log("STATUS:", response.status);

      const text = await response.text();

      console.log("BODY:", text);
    } catch (error) {
      console.error("ERROR:", error);
    }
  };

  return (
    <main style={{ padding: 40 }}>
      <button onClick={testFetch}>
        Test Backend
      </button>
    </main>
  );
}