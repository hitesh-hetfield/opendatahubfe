"use client";
import { arrayUnion, collection, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccount, useTransactionReceipt, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { ABI } from "../abi";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Page() {
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pendingPurchase, setPendingPurchase] = useState(null);

    const contractAddress = "0x4A39D5aDF5c20F4595aE4Da031A32dBc373CDb89";
    const contractABI = ABI;

    const { toast } = useToast()

    const { writeContractAsync: buyFn, isSuccess: buyFnSuccess, data: buyTxHash, isError: buyFnError } = useWriteContract();
    const { isSuccess: buyTxSuccess } = useTransactionReceipt({ hash: buyTxHash });
    const { address, isConnected, isDisconnected } = useAccount();

    useEffect(() => {
        if (buyFnError) {
            toast({
                title: "Transaction Failed 🛑",
                description: "Your transaction was dropped. Make sure you are connected and have enough funds.",
                variant: "destructive",
            });
        }

        if (buyFnSuccess && buyTxSuccess && pendingPurchase && !buyFnError) {
            updateOwnersArray(pendingPurchase.ipfshash);
            setPendingPurchase(null);
            toast({
                title: "Success",
                description: "Dataset bought successfully!",
            });
        }
    }, [buyFnSuccess, buyTxSuccess, buyFnError]);

    useEffect(() => {
        if (isConnected) {
            toast({
                title: "Wallet Connected 🗝️✅",
                description: "Your wallet is successfully disconnected.",
            });
        }
        if (isDisconnected) {
            toast({
                title: "Wallet Disconnected 🔐✅",
                description: "Your wallet is successfully connected.",
            });
        }
    }, [isConnected, isDisconnected]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "opendatahub"));
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

    useEffect(() => {
        fetchData();
    }, []);

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

    const checkOwnershipAndBuy = async (ipfshash, price, name) => {
        setLoading(true);
        try {
            const queryByIPFS = query(collection(db, "opendatahub"), where("metadataIpfsHash", "==", ipfshash));
            const querySnapshot = await getDocs(queryByIPFS);
            if (querySnapshot.empty) throw new Error("No document found with the provided IPFS hash");

            const doc = querySnapshot.docs[0];
            const owners = doc.data().owners || [];

            if (owners.includes(address)) {
                handleDownload(ipfshash, name);
            } else {
                setPendingPurchase({ ipfshash, docRef: doc.ref, name });
                const newPrice = Number(price) * 1.10;
                await buyFn({
                    address: contractAddress,
                    abi: contractABI,
                    functionName: "buyDataset",
                    args: [ipfshash],
                    value: parseEther(newPrice.toString()),
                    gasLimit: 500000,
                    gas: 500000
                });
            }
        } catch (error) {
            setError("Transaction failed");
            console.error("Transaction failed:", error);
            toast({
                title: "Transaction Failed",
                description: "Transaction failed! Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const updateOwnersArray = async (ipfshash) => {
        try {
            const queryByIPFS = query(collection(db, "opendatahub"), where("metadataIpfsHash", "==", ipfshash));
            const querySnapshot = await getDocs(queryByIPFS);
            if (querySnapshot.empty) throw new Error("No document found with the provided IPFS hash");

            const docRef = querySnapshot.docs[0].ref;
            await updateDoc(docRef, { owners: arrayUnion(address) });
            handleDownload(ipfshash);
        } catch (error) {
            setError("Failed to update owners array");
            console.error("Error updating owners array:", error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Explore & Buy Datasets</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {datasets.map((dataset) => (
                    <Card key={dataset.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-xl">{dataset.name}</CardTitle>
                            <CardDescription>{dataset.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-sm">{(dataset.price) - (dataset.price * 0.1)} 5ire</Badge>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={() => checkOwnershipAndBuy(dataset.metadataIpfsHash, dataset.price, dataset.name)}
                                className="w-full font-bold"
                                disabled={loading || isDisconnected}
                            >
                                {loading && pendingPurchase?.ipfshash === dataset.metadataIpfsHash ? (
                                    <Loader2 className="mr-2 h-4 w-3 animate-spin" />
                                ) : null}
                                Buy & Download CSV
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}