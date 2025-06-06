from dagster_components.components.shim_components.base import ShimComponent, ShimScaffolder
from dagster_components.scaffold import scaffold_with


class SensorScaffolder(ShimScaffolder):
    def get_text(self, filename: str) -> str:
        return f"""# import dagster as dg
# 
#
# @dg.sensor(target=...)
# def {filename}(context: dg.SensorEvaluationContext): ...

"""


@scaffold_with(SensorScaffolder)
class RawSensorComponent(ShimComponent):
    """Sensor component."""
