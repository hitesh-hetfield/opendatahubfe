"use client"
import { useEffect, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import axios from 'axios';
import { parseEther } from 'viem';
import { ABI } from '../abi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

const PinataAPIKey = process.env.NEXT_PUBLIC_API;
const PinataAPISecret = process.env.NEXT_PUBLIC_Secret;
const contractAddress = "0x4A39D5aDF5c20F4595aE4Da031A32dBc373CDb89";
const contractABI = ABI;

export default function UploadDataset() {
    const [file, setFile] = useState(null);
    const [metadata, setMetadata] = useState({ name: '', description: '', price: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast()

    const { address, isConnected, isDisconnected } = useAccount();
    const { writeContractAsync, isPending: isTransactionPending } = useWriteContract();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleMetadataChange = (e) => {
        setMetadata({ ...metadata, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (isConnected) {
            toast({
                title: "Wallet Connected 🗝️✅",
                description: "Your wallet is successfully connected.",
            });
        }
        if (isDisconnected) {
            toast({
                title: "Wallet Disconnected 🔐✅",
                description: "Your wallet is successfully disconnected.",
            });
        }
    }, [isConnected, isDisconnected]);

    const uploadToPinata = async (data, isFile = false) => {
        const url = `https://api.pinata.cloud/pinning/pin${isFile ? 'File' : 'JSON'}ToIPFS`;
        const formData = new FormData();

        if (isFile) {
            formData.append('file', data);
        } else {
            formData.append('pinataMetadata', JSON.stringify({ name: 'metadata.json' }));
            formData.append('pinataContent', JSON.stringify(data));
        }

        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': isFile ? 'multipart/form-data' : 'application/json',
                pinata_api_key: PinataAPIKey,
                pinata_secret_api_key: PinataAPISecret,
            },
        });
        toast({
            title: "File Uploaded",
            description: "Confirm in your wallet to register dataset",
        });
        return response.data.IpfsHash;
    };

    const handleRegister = async () => {
        if (!file || !metadata.name || !metadata.description || !metadata.price) {
            toast({
                title: "All fields are required 🛑",
                variant: "destructive",
            });
            return;
        }
        if (!isConnected || !address) {
            toast({
                title: "Wallet Not Connected 🗝️🛑",
                variant: "destructive",
            });
        }

        setLoading(true);

        try {
            const csvIpfsHash = await uploadToPinata(file, true);

            const metadataJson = {
                name: metadata.name,
                description: metadata.description,
                price: metadata.price,
                csvIpfsHash: csvIpfsHash,
            };

            const metadataIpfsHash = await uploadToPinata(metadataJson);

            console.log(metadataIpfsHash)
            const newPrice = Number(metadata.price) * 0.1
            console.log(newPrice)
            const hash = await writeContractAsync({
                address: contractAddress,
                abi: contractABI,
                functionName: 'registerDataset',
                args: [metadata.name, metadataIpfsHash, metadata.price],
                value: parseEther(newPrice.toString())
            });
            const docRef = doc(db, "opendatahub", metadataIpfsHash);

            await setDoc(docRef, {
                name: metadata.name,
                description: metadata.description,
                price: metadata.price,
                metadataIpfsHash: metadataIpfsHash,
                owners: [address]
            })

            console.log(hash);
            toast({
                title: "Success ⬆️✅",
                description: "Dataset registered successfully!",
            });
        } catch (err) {
            toast({
                title: "Transaction Failed 🛑",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full justify-center w-full items-center">
            <Card className="w-full max-w-md shadow-lg bg-accent/30">
                <CardHeader>
                    <CardTitle className="text-3xl font-mono">Sell Your Datasets</CardTitle>
                    {/* <CardDescription>Users will be able to see these details when buying your datasets.</CardDescription> */}
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="file"
                            className="text-sm font-bold text-secondary-foreground/80">Upload CSV File</Label>
                        <Input
                            className="hover:bg-black/30 focus:bg-black/20 transition-colors delay-75"
                            id="file" type="file" onChange={handleFileChange} accept=".csv" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-bold text-secondary-foreground/80">Dataset Name</Label>
                        <Input
                            className="hover:bg-black/30 p-6 focus:bg-black/20 transition-colors delay-75"
                            id="name"
                            type="text"
                            name="name"
                            placeholder="e.g. 2024 stock market dataset"
                            value={metadata.name}
                            onChange={handleMetadataChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-bold text-secondary-foreground/80">Description</Label>
                        <Textarea
                            className="hover:bg-black/30 p-6 focus:bg-black/20 transition-colors delay-75"

                            id="description"
                            type="text"
                            name="description"
                            placeholder="e.g. This dataset contains data for 2024 stock exchange data among companies..."
                            value={metadata.description}
                            onChange={handleMetadataChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="price" className="text-sm font-bold text-secondary-foreground/80">Price (5ire)</Label>
                        <Input
                            className="hover:bg-black/30 p-6 focus:bg-black/20 transition-colors delay-75"
                            id="price"
                            type="text"
                            name="price"
                            placeholder="e.g. 101"
                            value={metadata.price}
                            onChange={handleMetadataChange}
                        />
                    </div>
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter>
                    <Button
                        onClick={handleRegister}
                        disabled={loading || isTransactionPending || isDisconnected}
                        className="w-full font-bold"
                    >
                        {loading || isTransactionPending ? 'Registering...' : 'Register Dataset'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}