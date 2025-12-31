import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { stackServerApp } from '@/stack';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await stackServerApp.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const feedRef = doc(db, "communityFeed", id);
        const feedSnap = await getDoc(feedRef);

        if (!feedSnap.exists()) {
            return NextResponse.json({ error: "Feed item not found" }, { status: 404 });
        }

        const data = feedSnap.data();
        if (data.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden: You don't own this post" }, { status: 403 });
        }

        await deleteDoc(feedRef);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting feed item:", error);
        return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }
}
