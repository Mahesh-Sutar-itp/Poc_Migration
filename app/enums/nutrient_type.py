import enum


class NutrientType(str, enum.Enum):
    ENERGY_KCAL = "ENERGY_KCAL"
    PROTEIN = "PROTEIN"
    FAT = "FAT"
    SATURATED_FAT = "SATURATED_FAT"
    CARBOHYDRATES = "CARBOHYDRATES"
    SUGARS = "SUGARS"
    FIBER = "FIBER"
    SALT = "SALT"
    SODIUM = "SODIUM"
    VITAMIN_C = "VITAMIN_C"
    CALCIUM = "CALCIUM"
    IRON = "IRON"
