import django_filters
from django.db.models import Q

from apps.common.palestine import GOVERNORATE_BY_CODE
from .models import Product, Category


class ProductFilter(django_filters.FilterSet):
    """Advanced filtering for the marketplace product listing."""

    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    category = django_filters.ModelChoiceFilter(queryset=Category.objects.filter(is_active=True))
    category_slug = django_filters.CharFilter(field_name="category__slug")
    farmer = django_filters.NumberFilter(field_name="farmer__id")
    governorate = django_filters.CharFilter(method="filter_governorate")

    def filter_governorate(self, queryset, name, value):
        """Accept either a Palestine registry code or a free-text governorate name."""
        if not value:
            return queryset
        field = "farmer__farmer_profile__governorate"
        entry = GOVERNORATE_BY_CODE.get(value)
        if entry:
            return queryset.filter(
                Q(**{f"{field}__icontains": entry.name_ar})
                | Q(**{f"{field}__icontains": entry.name_en})
                | Q(**{f"{field}__iexact": value})
            )
        return queryset.filter(**{f"{field}__icontains": value})
    is_featured = django_filters.BooleanFilter()
    unit = django_filters.ChoiceFilter(choices=Product.Unit.choices)
    harvest_date_from = django_filters.DateFilter(field_name="harvest_date", lookup_expr="gte")
    harvest_date_to = django_filters.DateFilter(field_name="harvest_date", lookup_expr="lte")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(quantity_available__gt=0)
        return queryset

    class Meta:
        model = Product
        fields = [
            "category", "category_slug", "farmer", "unit",
            "is_featured", "min_price", "max_price",
            "harvest_date_from", "harvest_date_to", "in_stock", "governorate",
        ]
