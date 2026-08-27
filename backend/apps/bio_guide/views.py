from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from .services import get_bio_guide_response

class ConversationListCreateView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    # Get user's conversations
    def get(self, request):

        conversations = Conversation.objects.filter(
            user=request.user
        )

        serializer = ConversationSerializer(
            conversations,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    # Create new conversation
    def post(self, request):

        user_message = request.data.get("message")

        if not user_message:
            return Response(
                {"error": "Message is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        title = user_message.strip() 
        if len(title) > 60: title = title[:60].rstrip() + "..."
        # Create conversation
        conversation = Conversation.objects.create(
            user=request.user ,
            title = title
        )

        # Save user's message
        Message.objects.create(
            conversation=conversation,
            role="user",
            content=user_message
        )

        # Get AI response
        ai_response = get_bio_guide_response(
            user_message=user_message
        )

        # Save AI response
        Message.objects.create(
            conversation=conversation,
            role="assistant",
            content=ai_response
        )

        # Return complete conversation
        serializer = ConversationSerializer(
            conversation
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
        
class ConversationMessageView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):

        user_message = request.data.get("message")

        if not user_message:
            return Response(
                {"error": "Message is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get only the current user's conversation
        try:
            conversation = Conversation.objects.get(
                pk=pk,
                user=request.user
            )
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Get previous conversation messages
        previous_messages = conversation.messages.all()

        # Save new user message
        Message.objects.create(
            conversation=conversation,
            role="user",
            content=user_message
        )

        # Generate AI response using previous history
        ai_response = get_bio_guide_response(
            user_message=user_message,
            conversation_history=previous_messages
        )

        # Save AI response
        Message.objects.create(
            conversation=conversation,
            role="assistant",
            content=ai_response
        )

        # Return updated conversation
        serializer = ConversationSerializer(
            conversation
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )
        
        
class ConversationDeleteView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):

        try:
            conversation = Conversation.objects.get(
                pk=pk,
                user=request.user
            )

        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        conversation.delete()

        return Response(
            {"message": "Conversation deleted successfully."},
            status=status.HTTP_204_NO_CONTENT
        )