import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, type PublicUser } from '@/api/users';
import { getErrorMessage } from '@/api/api';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';

export default function PublicProfilePage() {
    const { userId } = useParams()
    const [profile, setProfile] = useState<PublicUser | null>(null)
    const [error, setError] = useState("")

    useEffect(() => {
        getUser(userId!)
            .then(setProfile)
            .catch((err) => setError(getErrorMessage(err)))
    }, [userId])

    if (error) return <ErrorState message={error} />
    if (!profile) return <LoadingState />

    return (
        <div className="mx-auto flex max-w-sm flex-col gap-2">
            <h1 className="text-2xl font-semibold">{profile.username}</h1>
            <p className="text-sm text-muted-foreground">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
    )
}