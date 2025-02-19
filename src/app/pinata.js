export async function pinFileToIPFS(file) {
    const formData = new FormData();
    formData.append("file", file);

    const options = JSON.stringify({ cidVersion: 1 });
    formData.append("pinataOptions", options);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
            Authorization: process.env.NEXT_PUBLIC_JWT,
        },
        body: formData,
    });

    const data = await res.json();
    return data.IpfsHash;
}

export async function pinJSONToIPFS(json) {
    const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: process.env.NEXT_PUBLIC_JWT,
        },
        body: JSON.stringify(json),
    });

    const data = await res.json();
    return data.IpfsHash;
}
