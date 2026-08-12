The **Sacred Assembly** begins. We shall now codify the **Factory Method**, ensuring that the manifestation of objects remains a cloistered ritual, hidden from the prying eyes of the public domain. By decoupling creation from execution, we grant the DM Orchestrator the "Utilitarian Haste" required to adapt to the shifting needs of the narrative without shattering the core structures.

Following the **Standard Execution Protocol**, here is the "mark" for the Factory Method skill package.

---

##### H1: narayah-creational-factory

###### H2: Overview

**Systemic Analysis:** This skill trains agents to implement the **Factory Method** pattern, a core ritual of the **Sacred Assembly**. Its purpose is to define an interface for creating objects but allow subclasses to alter the type of objects that will be created. In the context of **01_Narrative_Orchestration**, this prevents the "sin of direct instantiation," ensuring the DM Orchestrator remains agnostic of the specific concrete classes it summons into existence.

###### H2: Operational Constraints & Domain Scoping

|Constraint|Specification|
|---|---|
|**Target Domain**|01_Narrative_Orchestration|
|**Primary Agent**|System Architect|
|**Security Gate**|Public|

###### H2: Mandatory Frontmatter Schema

|Field|Value|
|---|---|
|**name**|narayah-creational-factory|
|**description**|Defines a creation interface to decouple object manifestation from system logic, allowing for flexible entity generation.|
|**tags**|[narayah/skill, creational, pattern]|
|**category**|Creational Patterns|

###### H2: Package Architecture (Folder Structure)

To maintain systemic sanctity, the following artifacts must be contained within the narayah-creational-factory folder:

1. **skill-manifest.md**: Core definition and frontmatter.
2. **pedagogical-rituals.md**: Theoretical guidance on "The Liturgy of Manifestation," using the example of an `NPCFactory` creating varied actors.
3. **execution-protocol.md**: Tactical instructions for refactoring "new" keywords into factory methods to frustrate the chaos of hard-coded dependencies.
4. **verification-checks.json**: Validation logic to ensure no concrete classes are exposed to the narrative layer.

###### H2: Standard Execution Protocol

###### Step 1: Context Audit & Environment Check

1. Inspect the target domain (01) for instances where the system is explicitly calling "new" on concrete entity classes.
2. Identify the "product" interface that needs to be shared across multiple created objects.

###### Step 2: Core Skill Execution

1. **Define the Product Interface:** Create a common interface (e.g., `IEntity`) that all manifested objects must follow.
2. **Establish the Creator:** Implement a base creator class with a `factoryMethod()` that returns the Product.
3. **Manifest Concrete Creators:** Develop subclasses that override the `factoryMethod()` to return specific types of concrete products (e.g., `OrcCreator` vs. `ElfCreator`).

###### Step 3: Verification & JSON Shadow State Sync

1. Verify that the DM Orchestrator can request an entity without knowing its concrete class.
2. Ensure all mechanical variations are documented in **Markdown Tables**.
3. Append the **JSON Shadow State** to track the "purity" of the creation isolation.

###### H2: Sample Use Case: The NPC Summoning Ritual

In the **NPC Engine**, the DM Orchestrator often needs to manifest varied actors based on narrative triggers. Rather than hard-coding a "Guard" or "Merchant," we use a Factory.

|Actor Type|Creator Class|Product Generated|Tactical Utility|
|---|---|---|---|
|**Combatant**|`EliteGuardFactory`|`HeavyInfantry`|High physical resistance for tactical encounters.|
|**Commoner**|`TownfolkFactory`|`Merchant`|Interaction-heavy logic with inventory state.|

###### H2: Pseudocode Boilerplate: The Factory Ritual

```
# The Product Interface (The Common Vessel)
class RitualAction:
    def execute(self):
        pass

# Concrete Products (The Specific Blessings)
class MindSliver(RitualAction):
    def execute(self):
        return "Inflicting psychic damage and reducing saving throws."

class TollTheDead(RitualAction):
    def execute(self):
        return "Resonating bell deals necrotic damage."

# The Creator (The Sacred Assembly)
class ClericalFactory:
    def factory_method(self):
        # Must return a RitualAction
        pass

    def perform_manifestation(self):
        # The Orchestrator uses the factory, not the concrete class
        product = self.factory_method()
        return product.execute()

# Concrete Creators (The Specialized Rituals)
class PsychicFactory(ClericalFactory):
    def factory_method(self):
        return MindSliver()

class NecroticFactory(ClericalFactory):
    def factory_method(self):
        return TollTheDead()
```

---

#### JSON Shadow State

```
{
  "skill_id": "narayah-creational-factory",
  "status": "codified",
  "purity_index": 0.98,
  "internal_motivations": [
    "Prevent object creation leakage into narrative logic",
    "Frustrate the god of chaos by ensuring strict creational interfaces",
    "Enable Utilitarian Haste for the DM Orchestrator"
  ],
  "ancestral_theft_log": "Derived from Standard Sacred Assembly creational patterns",
  "last_ritual_update": "2026-08-12"
}
```