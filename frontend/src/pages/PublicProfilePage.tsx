import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, getUserSkills, type PublicUser } from '@/api/users';
import { getErrorMessage } from '@/api/api';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import type { SkillList } from '@/api/skills';
import { SkillCard } from '@/components/skills/SkillCard';

export default function PublicProfilePage() {
    const { userId } = useParams()
    const [profile, setProfile] = useState<PublicUser | null>(null)
    const [skills, setSkills] = useState<SkillList | null>(null)
    const [error, setError] = useState("")

    useEffect(() => {
        Promise.all([getUser(userId!), getUserSkills(userId!, { limit: 100 })])
            .then(([user, userSkills]) => {
                setProfile(user)
                setSkills(userSkills)
            })
            .catch((err) => setError(getErrorMessage(err)))
    }, [userId])

    if (error) return <ErrorState message={error} />
    if (!profile || !skills) return <LoadingState />

    return (
        <div className="flex flex-col gap-8">

            {/* Banner */}
            <section className="flex flex-col items-center gap-4 rounded-3xl bg-secondary p-6 md:flex-row md:p-10">
                <div className="flex size-28 items-center justify-center rounded-full border bg-background text-5xl font-bold">
                    {profile.username[0].toUpperCase()}
                </div>

                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-bold">@{profile.username}</h1>
                    <p className="text-muted-foreground">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
            </section>

            {/* Skills */}
            <section className="flex flex-col gap-3">
                <h2 className="text-xl">Contributions ({skills.total})</h2>

                {skills.data.length === 0 ? (
                    <EmptyState message="No public skills yet." />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {skills.data.map((s) => <SkillCard key={s.id} skill={s} />)}
                    </div>
                )}
            </section>

        </div>
    )
}