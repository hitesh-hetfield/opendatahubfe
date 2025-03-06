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
import { DollarSign, Download, Loader2, ShoppingBagIcon, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingCard from "@/components/loadingCard";

export default function Page() {
    const [datasets, setDatasets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pendingPurchase, setPendingPurchase] = useState(null);
    const [isFetching, setIsFetching] = useState(true);

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
            fetchData();
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
        setIsFetching(true)
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
            setIsFetching(false)
        }
    };

    useEffect(() => {
        fetchData();
    }, [address]);

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
        console.log(ipfshash, price, name);
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
                    value: parseEther(price.toString()),
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

    if (error) return <div className="w-full text-lg font-mono font-bold h-full flex gap-2 items-center justify-center">
        <ShoppingBagIcon />
        No datasets available at the moment
    </div>

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-5 font-mono border-b-2 border-accent py-1">Explore & Buy Datasets</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {
                    isFetching ?
                        Array.from({ length: 5 }, (index) => (
                            <LoadingCard key={index} />
                        ))
                        :
                        datasets.map((dataset) => (
                            <Card key={dataset.id} className="shadow-lg bg-accent/40 flex flex-col h-full">
                                <CardHeader className="flex-grow">
                                    <CardTitle className="text-xl">{dataset.name}</CardTitle>
                                    <CardDescription>{dataset.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-lg text-muted-foreground">
                                            {dataset.price} 5ire
                                        </Badge>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex-shrink-0">
                                    {
                                        dataset.owners?.includes(address)
                                            ?
                                            <Button
                                                variant={"outline"}
                                                onClick={() => handleDownload(dataset.metadataIpfsHash, dataset.name)}
                                                className="w-full hover:bg-black transition-all font-bold py-6 text-base"
                                                disabled={loading || isDisconnected}
                                            >
                                                {loading && pendingPurchase?.ipfshash === dataset.metadataIpfsHash ? (
                                                    <Loader2 className="mr-2 h-4 w-3 animate-spin" />
                                                ) : null}
                                                <Download /> Download
                                            </Button>
                                            :
                                            <Button
                                                onClick={() => checkOwnershipAndBuy(dataset.metadataIpfsHash, dataset.price, dataset.name)}
                                                className="w-full font-bold py-5 text-base"
                                                disabled={loading || isDisconnected}
                                            >
                                                {loading && pendingPurchase?.ipfshash === dataset.metadataIpfsHash ? (
                                                    <Loader2 className="mr-2 h-4 w-3 animate-spin" />
                                                ) : null}
                                                <DollarSign /> Buy Dataset
                                            </Button>
                                    }
                                </CardFooter>
                            </Card>
                        ))
                }

            </div>
        </div>
    );
}