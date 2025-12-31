import { NextRequest, NextResponse } from 'next/server';
import { stackServerApp } from '@/stack';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await stackServerApp.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = user.id;
        const { id } = await params;

        const feedRef = doc(db, "communityFeed", id);
        const feedSnap = await getDoc(feedRef);

        if (!feedSnap.exists()) {
            return NextResponse.json({ error: "Feed item not found" }, { status: 404 });
        }

        const data = feedSnap.data();
        const likedBy = data.likedBy || [];
        const hasLiked = likedBy.includes(userId);

        if (hasLiked) {
            // Unlike
            await updateDoc(feedRef, {
                likes: increment(-1),
                likedBy: arrayRemove(userId)
            });
        } else {
            // Like
            await updateDoc(feedRef, {
                likes: increment(1),
                likedBy: arrayUnion(userId)
            });
        }

        return NextResponse.json({ success: true, hasLiked: !hasLiked });
    } catch (error) {
        console.error("Error liking feed item:", error);
        return NextResponse.json({ error: "Failed to like item" }, { status: 500 });
    }
}
