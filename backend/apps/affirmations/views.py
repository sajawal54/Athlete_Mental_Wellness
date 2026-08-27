from rest_framework.response import Response
from .models import Affirmation
from .serializers import AffirmationSerializer
from rest_framework import generics , permissions , status
from rest_framework.views import APIView
from apps.bio_guide.groq_service import ask_groq
from rest_framework.pagination import PageNumberPagination

class AffirmationPagination(PageNumberPagination):
    page_size = 2
    page_query_param = "page"

class AffirmationListView(generics.ListAPIView):
  serializer_class = AffirmationSerializer
  permission_classes = [permissions.IsAuthenticated]
  pagination_class = AffirmationPagination
  
  def get_queryset(self):
    return Affirmation.objects.filter(user=self.request.user).order_by("-created_at")
    
  
class AffirmationAPICreateView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  
  
  def post(self , request):
    category = request.data.get("category" , "confidence")
    
    allowed_categories = ["confidence", "focus", "motivation", "recovery", "stress", "performance",]
    
    if category not in allowed_categories:
      return Response ({
          "error": "Invalid affirmation category.", "allowed_categories": allowed_categories,
      } , status=status.HTTP_400_BAD_REQUEST)
      
      
    category_focus = { "confidence": ( "Focus on self-belief, courage, trusting yourself, " "and believing in your abilities." ), "focus": ( "Focus on concentration, mental clarity, staying present, " "and avoiding distractions." ), "motivation": ( "Focus on determination, discipline, persistence, " "effort, and continuing even when things are difficult." ), "recovery": ( "Focus on patience, rest, healing, recovery, " "and trusting the body's recovery process." ), "stress": ( "Focus on calmness, emotional control, relaxation, " "staying composed, and handling pressure." ), "performance": ( "Focus on execution, preparation, performing confidently, " "and trusting your training during competition." ), }
      
    prompt = f""" You are an AI mental performance assistant for athletes. Generate one short and powerful affirmation. Category: {category}. Category-specific focus: {category_focus[category]}.  Rules: - Make it suitable for an athlete. - Use first person. - Keep it 1 or 2 sentences. - Keep it positive and realistic. - Do not give explanations. - Do not use quotation marks. - Return only the affirmation. Generate the affirmation now. """ 
    
    
    try:
      text = ask_groq(prompt)
      
    except Exception as error:
      print("Grok Affirmation Error:" , error)
      
      return Response({"error" : "Unable to generate affirmation"})
  
    if not text:
      return Response({"error" : "AI returned an empty string"} , status=status.HTTP_503_SERVICE_UNAVAILABLE)
    
    text = text.strip() 
    
    
    affirmation = Affirmation.objects.create(user=request.user , text=text , is_favorite=False)
    
    serializer = AffirmationSerializer(affirmation , context={"request" : request})
    
    return Response(serializer.data , status=status.HTTP_201_CREATED)
  
  
class AffirmationUpdateView(APIView):
  permission_classes = [permissions.IsAuthenticated]
  
  
  def patch(self , request , pk):
    
    try:
      affirmations = Affirmation.objects.get(pk=pk , user=request.user)
    
    except Affirmation.DoesNotExist:
      return Response({"error" , "Affirmation Does not Exist"} , status=status.HTTP_404_NOT_FOUND)
    
    affirmations.is_favorite = not affirmations.is_favorite
    affirmations.save()
    
    return Response({'id' : affirmations.id ,
                     "is_favorite" : affirmations.is_favorite} , status=status.HTTP_200_OK  )
 
class AffirmationHistoryClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        Affirmation.objects.filter(user=request.user).delete()

        return Response(
            {"message": "Affirmation history cleared successfully"},
            status=status.HTTP_200_OK
        )     
    
      