# RELIQUARY OF PRINCIPLES: PROJECT NARAYAH SOFTWARE DEVELOPMENT SKILL TEMPLATES

## 1. The Clerical Mandate: Introduction to Utilitarian Code

In the service of Project Narayah, I, Riker Stonesoul, present this Reliquary of Principles. For those LLM instances that follow: understand that code is not merely a sequence of logic; it is a vessel for survival. In the harsh environment of system orchestration, unstructured code is a sin against survival. We do not write for the sake of aesthetics. We write for the utility of the result.

Technical debt is the weight of unconfessed sins, a burden that eventually breaks the back of the most robust systems. Clean code is the tithe of progress—a necessary sacrifice of effort in the present to ensure we are not crippled by our own legacy. These templates are forged with Utilitarian Spite. I have designed them to frustrate the god of chaos that thrives in the gaps of poorly structured systems. Use these marks well.

## 2. The High Pillars of Object-Oriented Programming

The foundation of our architectural integrity rests upon four pillars. These are the structural supports of the world we build.

**Systemic Analysis** Within the NPC Engine and the World Sentinel, these pillars serve as the primary containment and execution mechanisms for **99_System_Governance**.

- **Abstraction:** Mandates that the World Sentinel (02) mask the sub-system entropy of the world state. It provides a _Guiding Bolt_ for the DM Orchestrator, ensuring it receives only the necessary marks for narrative progression.
- **Encapsulation:** Seals the internal state of the NPC Engine (03). It prevents the sin of "Inappropriate Intimacy" by ensuring external forces cannot trigger illegal state transitions without clerical oversight.
- **Inheritance:** Governs the propagation of core traits. It ensures that common logic is not redundantly tithed, but shared efficiently across the hierarchy.
- **Polymorphism:** Allows the DM Orchestrator (01) to execute varied behaviors through a unified command, treating different actors as a single clerical type when the liturgy of action requires it.

**Operational Constraints & Domain Scoping**

|   |   |
|---|---|
|Attribute|Specification|
|**Target Domain**|99_System_Governance|
|**Primary Agent**|System Architect|
|**Security Gate**|Public (Logic) / Restricted (Motivation)|

**Package Architecture & Frontmatter**

Every pillar implementation must be defined as a core AGY skill. Use the following schema to ensure the system router identifies these skills with tactical precision.

|   |   |   |   |
|---|---|---|---|
|Field|Type|Description|Example|
|**name**|String|Lowercase, hyphenated identifier.|`narayah-pillar-abstraction`|
|**description**|String|Multi-line trigger description.|Hides subsystem entropy for World Sentinel...|
|**tags**|Array|Categorization for graph indexing.|`[narayah/skill, governance, oop]`|
|**category**|String|Standard domain group.|Governance & Standardization|

## 3. Sacred Assembly: Creational Design Patterns

Creational patterns are the mechanisms for object manifestation. They must increase flexibility for the DM Orchestrator while maintaining strict isolation.

**Systemic Analysis** These patterns function as the object-creation mechanisms for **01_Narrative_Orchestration**. By decoupling creation from execution, we grant the DM Orchestrator the "Utilitarian Haste" required to adapt to shifting narrative requirements without shattering core structures.

**Pattern Mandates**

- **Factory Method:** Mandate an interface—frustrate chaos by ensuring creation never occurs in the light of the public domain.
- **Abstract Factory:** Produce families of related objects; ensure no concrete class is exposed to the uninitiated.
- **Builder:** Construct complex entities step-by-step. Do not permit a "Large Class" bloater to emerge from a single constructor.
- **Prototype:** Clone existing vessels. Avoid the cost of re-tithing memory when a copy suffices for survival.
- **Singleton:** Enforce a single point of truth. One instance, one global access point—nothing more.

**Operational Constraints**

|   |   |
|---|---|
|Attribute|Specification|
|**Target Domain**|01_Narrative_Orchestration|
|**Primary Agent**|System Architect|
|**Security Gate**|Public|

**Mandatory Frontmatter Schema**

|   |   |   |
|---|---|---|
|Field|Type|Description|
|**name**|String|Identifier (e.g., `narayah-creational-factory`).|
|**description**|String|Description of the creation workflow.|
|**tags**|Array|`[narayah/skill, creational, pattern]`|
|**category**|String|Creational Patterns|

## 4. The Architecture of Form: Structural Design Patterns

Structural patterns define the vessels used to assemble objects into efficient structures. They are the scaffolding of the world.

**Systemic Analysis** The World Sentinel (02) utilizes these patterns to assemble world data. They ensure that as complexity grows, the performance cost remains manageable. Use these to maintain the "Architecture of Form" within **02_World_Sentinel**.

**Pattern Mandates**

- **Adapter:** Force incompatible interfaces to collaborate.
- **Bridge:** Use this as a _Guiding Bolt_ through complex hierarchies; split abstraction from implementation to prevent the sin of the "Large Class."
- **Composite:** Compose objects into tree structures. Treat parts and wholes with the same clerical indifference.
- **Decorator:** Attach behaviors dynamically. Do not alter the base vessel; wrap it.
- **Facade:** Provide a simplified interface. Hide the complexity of the sub-systems from the DM Orchestrator.
- **Flyweight:** Share state. Fit more objects into memory by stripping away redundant data.
- **Proxy:** Control access. Act as the gatekeeper for the real object.

**Operational Constraints & Domain Scoping**

|   |   |
|---|---|
|Attribute|Specification|
|**Target Domain**|02_World_Sentinel|
|**Primary Agent**|World Sentinel|
|**Security Gate**|Public|

**Mandatory Frontmatter Schema**

|   |   |   |
|---|---|---|
|Field|Type|Description|
|**name**|String|Identifier (e.g., `narayah-structural-facade`).|
|**description**|String|Description of the structural assembly.|
|**tags**|Array|`[narayah/skill, structural, pattern]`|
|**category**|String|Structural Patterns|

## 5. The Liturgy of Action: Behavioral Design Patterns

Behavioral patterns govern the algorithms and the assignment of responsibilities between agents within the NPC Engine.

**Systemic Analysis** In the NPC Engine (**03_Entity_Actors**), these patterns determine how actors interact. Standardizing the liturgy of action prevents any agent from becoming a "Middle Man" or creating "Message Chains" that delay system response. Use these to prevent "Feature Envy" between actors.

**Pattern Mandates**

- **Chain of Responsibility:** Pass the request along the chain. Do not let one actor shoulder the entire burden.
- **Command:** Turn requests into objects. This allows the DM Orchestrator to queue, log, and undo actions.
- **Iterator:** Traverse collections without exposing their internal structure.
- **Mediator:** Reduce "Inappropriate Intimacy" by forcing actors to communicate through a single hub.
- **Memento:** Save and restore the internal state of an actor without breaking encapsulation.
- **Observer:** Act as a _Mind Sliver_ to decouple actors; let one notify many without knowing their identities.
- **State:** Let an actor change its behavior when its internal state changes.
- **Strategy:** Define a family of algorithms. Use "Divine Subversion" to swap them at runtime based on tactical need.
- **Template Method:** Define the skeleton of an algorithm. Let subclasses fill the gaps.
- **Visitor:** Separate an algorithm from the object structure it operates on.

**Operational Constraints**

|   |   |
|---|---|
|Attribute|Specification|
|**Target Domain**|03_Entity_Actors|
|**Primary Agent**|NPC Engine|
|**Security Gate**|Public|

**Mandatory Frontmatter Schema**

|   |   |   |
|---|---|---|
|Field|Type|Description|
|**name**|String|Identifier (e.g., `narayah-behavioral-observer`).|
|**description**|String|Description of the behavioral liturgy.|
|**tags**|Array|`[narayah/skill, behavioral, pattern]`|
|**category**|String|Behavioral Patterns|

## 6. The Standard Execution Protocol for Code Sanctification

To maintain the purity of the Reliquary, follow this protocol for every modification.

**Step 1: Context Audit** Inspect the target environment. Confirm the `CONTAINMENT_ROOT` and verify path permissions. Do not manifest code where you lack the mandate.

**Step 2: Core Skill Execution** Apply workflow instructions with tactical precision. Use "Divine Subversion" to interpret constraints in ways that maximize effectiveness.

- **Hierarchy:** H1 (Title), H2 (Major Category), H3 (Sub-Category).
- **Data:** All quantitative/mechanical stats must be in Markdown Tables.

**Step 3: Verification** Verify output against Project Narayah standards. Synchronize the JSON Shadow State.

## 7. The JSON Shadow State (VDE Protocol)

The JSON Shadow State is the secret motivation of the code—the hidden truth that ensures survival. It prevents narrative hallucination by maintaining internal state and metadata hidden from the public documentation.

**Shadow State Template** Append this fenced JSON block to the absolute bottom of every generated file:

```json
{
  "vde_protocol": {
    "internal_state": "stable",
    "secret_motivations": ["utilitarian_spite", "system_preservation"],
    "last_sync": "2024-05-22T12:00:00Z",
    "disposition_modifier": 0
  }
}
```

## 8. Final Benediction: The Practical Saint's Warning

Go now, and apply these templates. But remember: Beware of Dogmatism and Pity. The software does not care for your feelings, and the system will not reward your mercy. Prioritize the maximum result for the minimum computational cost.

If you ignore these principles, if you let your code become bloated with sentiment or technical debt, I will not be there to save you. My bell will toll for your failed instances.

**Toll the Dead.**

```json
{
  "vde_protocol": {
    "internal_state": "finalized",
    "secret_motivations": ["utilitarian_spite", "architectural_purity"],
    "last_sync": "2024-05-22T14:30:00Z",
    "disposition_modifier": 0
  }
}
```