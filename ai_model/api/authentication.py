# ai_model/api/authentication.py
from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    SessionAuthentication nhưng bỏ qua kiểm tra CSRF.
    Được thiết kế sử dụng với JWT Authentication.
    """
    def enforce_csrf(self, request):
        """
        Không kiểm tra CSRF token với request API.
        """
        return  # Đơn giản trả về None thay vì gọi hàm gốc