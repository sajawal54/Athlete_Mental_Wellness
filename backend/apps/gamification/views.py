from rest_framework import generics , permissions , status
from django.shortcuts import get_object_or_404
from .serializers import XPHistorySerializer , BadgeSerializer , UserBadgeSerializer , RewardSerializer , UserRewardSerializer 
from .models import XPHistory , Badge , UserBadge , Reward , UserReward 
from rest_framework.views import APIView
from apps.accounts.models import Profile
from rest_framework.response import Response
from apps.accounts.serializers import ProfileSerializer
from .service import claim_reward
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class XPHistoryListView(generics.ListAPIView):
  serializer_class = XPHistorySerializer
  permission_classes = [permissions.IsAuthenticated]
  pagination_class = StandardResultsSetPagination
  
  def get_queryset(self):
    return XPHistory.objects.filter(user=self.request.user)


class BadgeListView(generics.ListAPIView):
  serializer_class = BadgeSerializer
  permission_classes = [permissions.IsAuthenticated]
  
  queryset =  Badge.objects.all()
  
  
class UserBadgeListView(generics.ListAPIView):
  serializer_class = UserBadgeSerializer
  permission_classes = [permissions.IsAuthenticated]
  
  
  def get_queryset(self):
    return UserBadge.objects.filter(user=self.request.user)
  
class RewardListView(generics.ListAPIView):
  serializer_class = RewardSerializer
  permission_classes = [permissions.IsAuthenticated]
  
  queryset = Reward.objects.filter(is_active=True)
  
class UserRewardListView(generics.ListAPIView):
  serializer_class = UserRewardSerializer
  permission_classes = [permissions.IsAuthenticated]
  
  def get_queryset(self):
    return UserReward.objects.filter(user=self.request.user)



class GamificationOverviewAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        profile, _ = Profile.objects.get_or_create(user=user)

        return Response({
            "profile": ProfileSerializer(profile).data,

            "xp_history": XPHistorySerializer(
                XPHistory.objects.filter(user=user).order_by("-created_at"),
                many=True
            ).data,

            "badges": BadgeSerializer(
                Badge.objects.all(),
                many=True
            ).data,

            "earned_badges": UserBadgeSerializer(
                UserBadge.objects.filter(user=user).select_related("badge"),
                many=True
            ).data,

            "rewards": RewardSerializer(
                Reward.objects.filter(is_active=True),
                many=True
            ).data,

            "user_rewards": UserRewardSerializer(
                UserReward.objects.filter(user=user).select_related("reward"),
                many=True
            ).data,
        })
        
class ClaimRewardAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, reward_id):
        reward = get_object_or_404(
            Reward,
            id=reward_id,
            is_active=True
        )

        result = claim_reward(
            request.user,
            reward
        )

        if not result["success"]:
            return Response(
                result,
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            result,
            status=status.HTTP_200_OK
        )