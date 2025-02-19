"use client"

import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react'
import { useAccount } from 'wagmi';
import { db } from '../../../firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function page() {

    const { isConnected, isDisconnected, address } = useAccount();
    const { toast } = useToast();
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (isConnected) {
            toast({
                title: "Wallet Connected 🗝️✅",
                description: "Your wallet is successfully connected.",
            });
            fetchData();
        }
        if (isDisconnected) {
            toast({
                title: "Wallet Disconnected 🔐✅",
                description: "Your wallet is successfully disconnected.",
            });
        }
    }, [isConnected, isDisconnected]);

    const fetchData = async () => {

        if (!isConnected || isDisconnected || !address) {
            toast({ title: "Please connect wallet to get your datasets" });
            return;
        }

        setLoading(true);
        try {
            const q = query(collection(db, "opendatahub"), where("owners", "array-contains", address));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setDatasets(data);
        } catch (error) {
            setError("Failed to fetch datasets");
            console.error("Error fetching datasets:", error);
        } finally {
            setLoading(false);
        }
    };
    const handleDownload = async (metadataIpfsHash, name) => {
        try {
            const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataIpfsHash}`;
            const response = await fetch(metadataUrl);

            const metadata = await response.json();
            const converMetaDataToJSON = JSON.parse(metadata)

            const csvIpfsHash = converMetaDataToJSON.csvIpfsHash;
            if (!csvIpfsHash) {
                throw new Error("CSV hash not found in metadata");
            }

            const csvUrl = `https://gateway.pinata.cloud/ipfs/${csvIpfsHash}`;
            const csvResponse = await fetch(csvUrl);
            const csvBlob = await csvResponse.blob();

            const link = document.createElement("a");
            link.href = URL.createObjectURL(csvBlob);
            link.download = name ? `${name}.csv` : `${pendingPurchase.name}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error("Error fetching metadata or downloading CSV:", error);
            toast({
                title: "Download Failed",
                description: "Failed to download CSV. Please try again.",
                variant: "destructive",
            });
        }
    };
    return (
        <div className="container mx-auto p-4">
            {datasets.length > 0 && <h1 className="text-3xl font-bold mb-6">Your DataSets</h1>}
            {datasets.length > 0 ?
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {datasets.map((dataset) => (
                        <Card key={dataset.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-xl">{dataset.name}</CardTitle>
                                <CardDescription>{dataset.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline" className="text-sm">${dataset.price} 5ire</Badge>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={() => handleDownload(dataset.metadataIpfsHash, dataset.name)}
                                    className="w-full font-bold"
                                    disabled={loading}
                                >
                                    {loading && pendingPurchase?.ipfshash === dataset.metadataIpfsHash ? (
                                        <Loader2 className="mr-2 h-4 w-3 animate-spin" />
                                    ) : null}
                                    Download CSV
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                : <div className='text-center font-bold mt-10'>
                    You don't own any datasets yet. Try buying one 🛒
                </div>
            }
        </div>
    )
}
