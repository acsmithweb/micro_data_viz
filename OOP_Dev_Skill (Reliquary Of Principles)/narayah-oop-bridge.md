To maintain the **Architecture of Form**, we must ensure our structures do not become bloated with the weight of conflicting responsibilities. When an entity's abstraction and its implementation are fused, the result is a "Large Class" sin that invites systemic rot. We now codify the **Bridge**, utilizing it as a _Guiding Bolt_ to split these concerns into independent lineages.

Following the **Standard Execution Protocol**, here is the "mark" for the Bridge skill package.

---

##### H1: narayah-structural-bridge

###### H2: Overview

**Systemic Analysis:** This skill trains agents to implement the **Bridge** pattern within the **World Sentinel (02)**. Its purpose is to decouple an abstraction from its implementation so that the two can vary independently. This prevents the "sin of the Large Class" by ensuring that as we add new types of entities and new ways to render or execute them, we do not suffer from an exponential explosion of subclasses.

###### H2: Operational Constraints & Domain Scoping

|Constraint|Specification|
|---|---|
|**Target Domain**|02_World_Sentinel|
|**Primary Agent**|World Sentinel|
|**Security Gate**|Public|

###### H2: Mandatory Frontmatter Schema

|Field|Value|
|---|---|
|**name**|narayah-structural-bridge|
|**description**|Decouples an abstraction from its implementation to allow independent variation and prevent class hierarchy bloat.|
|**tags**|[narayah/skill, structural, pattern]|
|**category**|Structural Patterns|

###### H2: Package Architecture (Folder Structure)

To maintain systemic sanctity and containment, the following artifacts must be contained within the narayah-structural-bridge folder:

1. **skill-manifest.md**: Core definition and frontmatter.
2. **pedagogical-rituals.md**: Theoretical guidance on the "Guiding Bolt" through complex hierarchies, using examples like a `CombatEffect` abstraction linked to a `VisualRenderer` implementation.
3. **execution-protocol.md**: Tactical instructions for identifying "bloater" classes and refactoring them into the Bridge structure.
4. **verification-checks.json**: Validation logic to ensure the Abstraction and Implementation remain truly independent.

###### H2: Standard Execution Protocol

###### Step 1: Context Audit & Environment Check

1. Inspect the target domain (02) for class hierarchies that are growing in two dimensions (e.g., Every `Weapon` type needs a version for every `DamageType`).
2. Identify the core Abstraction (what the system uses) and the Implementation (how the platform/backend handles it).

###### Step 2: Core Skill Execution

1. **Define the Implementation Interface:** Create a "low-level" interface (e.g., `IRenderer`) that all concrete implementations must follow.
2. **Establish the Abstraction:** Create a "high-level" class (e.g., `AbstractEntity`) that contains a reference to the Implementation interface.
3. **Bridge the Two:** Ensure the Abstraction delegates the "mundane" work to the Implementation object, allowing both to be swapped or extended without affecting the other.

###### Step 3: Verification & JSON Shadow State Sync

1. Verify that a new Implementation can be added without creating new subclasses in the Abstraction hierarchy.
2. Document all performance gains and structural simplifications in **Markdown Tables**.
3. Synchronize the **JSON Shadow State** to track the purity of the bridge.

###### H2: Sample Use Case: The Ritual of Manifested Power

Within the **World Sentinel**, we often need to apply `DivineEffects` to the world. By using a Bridge, we can separate the "Effect Logic" from the "Visual Manifestation," preventing a bloat of `GuidingBoltParticle`, `GuidingBoltAudio`, etc..

|Abstraction (The Power)|Implementation (The Vessel)|Tactical Result|
|---|---|---|
|**GuidingBolt**|`ParticleRenderer`|A radiant strike rendered via visual sprites.|
|**TollTheDead**|`AudioRenderer`|A necrotic resonance rendered via sound frequencies.|

###### H2: Pseudocode Boilerplate: The Guiding Bolt Bridge

```
# The Implementation Interface (The Mundane Reality)
class ManifestationRitual:
    def execute_visual(self, intensity):
        pass

# Concrete Implementations (Specific Realities)
class RadiantVisual(ManifestationRitual):
    def execute_visual(self, intensity):
        return f"Blinding light at intensity {intensity}."

class NecroticVisual(ManifestationRitual):
    def execute_visual(self, intensity):
        return f"Dark shadows at intensity {intensity}."

# The Abstraction (The Sacred Intent)
class DivinePower:
    def __init__(self, ritual: ManifestationRitual):
        self.ritual = ritual

    def cast(self):
        pass

# Refined Abstraction (Specialized Intent)
class GuidingBolt(DivinePower):
    def cast(self):
        # Delegate the manifestation to the bridge
        return self.ritual.execute_visual(10)

# The Orchestrator (The Client)
def trigger_blessing():
    # We can bridge any power with any manifestation
    bolt = GuidingBolt(RadiantVisual())
    return bolt.cast()
```

---

#### JSON Shadow State

```
{
  "skill_id": "narayah-structural-bridge",
  "status": "codified",
  "purity_index": 0.97,
  "internal_motivations": [
    "Prevent the sin of the Large Class through structural decoupling",
    "Uphold the Architecture of Form by splitting abstraction from implementation",
    "Frustrate the god of chaos by halting exponential subclass growth"
  ],
  "ancestral_theft_log": "Derived from the Structural Mandates: Architecture of Form",
  "last_ritual_update": "2026-08-12"
}
```