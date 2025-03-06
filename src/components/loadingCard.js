import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export default function LoadingCard() {
    return (
        <Card className="shadow-lg bg-muted flex flex-col h-full">
            <CardHeader className="flex-grow">
                <CardTitle className="text-xl w-[60%] p-1 bg-black/30 rounded-lg animate-pulse">
                    <div className="opacity-0">Some Name Here</div>
                </CardTitle>
                <CardDescription className="bg-black/30 rounded-lg animate-pulse"><div className="opacity-0">This is some description text here..</div></CardDescription>
            </CardHeader>
            <CardContent className="flex-shrink-0">
                <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-sm bg-black/30 rounded-lg animate-pulse">
                        <div className="opacity-0">23 5ire</div>
                    </Badge>
                </div>
            </CardContent>
            <CardFooter className="flex-shrink-0">
                <Button
                    variant={"outline"}
                    className="bg-black/30 rounded-lg w-full animate-pulse"
                >
                    <div className="opacity-0">Download</div>
                </Button>
            </CardFooter>
        </Card>
    )
}
