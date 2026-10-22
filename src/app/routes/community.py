"""API routes for community features."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import DbSession, get_current_user
from app.models.user import User
from app.schemas.community import (
    CommentCreate,
    CommentResponse,
    CommentUpdate,
    ForkCreate,
    ForkResponse,
    RatingCreate,
    RatingResponse,
    SavedSkillResponse,
    SkillVersionCreate,
    SkillVersionResponse,
)
from app.services.community import CommunityService

router = APIRouter(prefix="/community", tags=["Community"])


@router.get("/skills/{skill_id}/comments", response_model=list[CommentResponse])
def list_comments(skill_id: int, db: DbSession):
    return CommunityService(db).list_comments(skill_id)


@router.post(
    "/skills/{skill_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_comment(
    skill_id: int,
    data: CommentCreate,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    return CommunityService(db).create_comment(skill_id, current_user.id, data)


@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    data: CommentUpdate,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    return CommunityService(db).update_comment(comment_id, current_user.id, data)


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    CommunityService(db).delete_comment(comment_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put(
    "/skills/{skill_id}/rating",
    response_model=RatingResponse,
)
def rate_skill(
    skill_id: int,
    data: RatingCreate,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    return CommunityService(db).create_or_update_rating(
        skill_id, current_user.id, data
    )


@router.post(
    "/skills/{skill_id}/save",
    response_model=SavedSkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def save_skill(
    skill_id: int,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    return CommunityService(db).save_skill(skill_id, current_user.id)


@router.delete(
    "/skills/{skill_id}/save",
    status_code=status.HTTP_204_NO_CONTENT,
)
def unsave_skill(
    skill_id: int,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    CommunityService(db).unsave_skill(skill_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/saved-skills", response_model=list[SavedSkillResponse])
def list_saved_skills(
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    return CommunityService(db).list_saved_skills(current_user.id)


@router.get(
    "/skills/{skill_id}/versions",
    response_model=list[SkillVersionResponse],
)
def list_versions(skill_id: int, db: DbSession):
    return CommunityService(db).list_versions(skill_id)


@router.post(
    "/skills/{skill_id}/versions",
    response_model=SkillVersionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_version(
    skill_id: int,
    data: SkillVersionCreate,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    return CommunityService(db).create_version(
        skill_id, current_user.id, data
    )


@router.post(
    "/forks",
    response_model=ForkResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_fork(
    data: ForkCreate,
    db: DbSession,
    current_user: User = Depends(get_current_user),
):
    return CommunityService(db).create_fork(
        data.original_skill_id,
        data.forked_skill_id,
        current_user.id,
    )